const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Group = require('../models/Group');
const File = require('../models/File');

module.exports = function(io) {
  // Store online users
  const onlineUsers = new Map();
  
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // User joins with their ID
    socket.on('user_connected', async (userId) => {
      if (userId) {
        // Add user to online users
        onlineUsers.set(userId, socket.id);
        
        // Update user status to online
        await User.findByIdAndUpdate(userId, { status: 'online' });
        
        // Notify all users about online status
        io.emit('user_status_change', { userId, status: 'online' });
        
        console.log(`User ${userId} connected`);
      }
    });
    
    // User sends a message
    socket.on('send_message', async (data) => {
      try {
        const { sender, recipient, group, content, attachments } = data;
        
        // Save message to database
        const newMessage = new Message({
          sender,
          recipient,
          group,
          content,
          attachments: attachments || []
        });
        
        const savedMessage = await newMessage.save();
        
        if (group) {
          // Update group conversation
          const conversation = await Conversation.findOneAndUpdate(
            { group },
            {
              group,
              lastMessage: savedMessage._id,
              updatedAt: Date.now()
            },
            { upsert: true, new: true }
          );
          
          // Get group members
          const groupData = await Group.findById(group);
          
          // Get populated message
          const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'name avatar')
            .populate('attachments');
          
          // Send to all online group members
          groupData.members.forEach(memberId => {
            const memberSocketId = onlineUsers.get(memberId.toString());
            if (memberSocketId && memberSocketId !== socket.id) {
              io.to(memberSocketId).emit('receive_group_message', {
                message: populatedMessage,
                group: groupData
              });
            }
          });
          
          // Send back to sender for confirmation
          socket.emit('group_message_sent', {
            message: populatedMessage,
            group: groupData
          });
        } else {
          // Update or create direct conversation
          const conversation = await Conversation.findOneAndUpdate(
            {
              participants: { $all: [sender, recipient] }
            },
            {
              participants: [sender, recipient],
              lastMessage: savedMessage._id,
              updatedAt: Date.now(),
              $inc: { [`unreadCount.${recipient}`]: 1 }
            },
            { upsert: true, new: true }
          );
          
          // Get populated message
          const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'name avatar')
            .populate('recipient', 'name avatar')
            .populate('attachments');
          
          // Send to recipient if online
          const recipientSocketId = onlineUsers.get(recipient);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive_message', populatedMessage);
          }
          
          // Send back to sender for confirmation
          socket.emit('message_sent', populatedMessage);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
    
    // User joins a group chat room
    socket.on('join_group', async (data) => {
      const { userId, groupId } = data;
      
      // Join socket room for this group
      socket.join(`group_${groupId}`);
      
      console.log(`User ${userId} joined group ${groupId}`);
    });
    
    // User leaves a group chat room
    socket.on('leave_group', async (data) => {
      const { userId, groupId } = data;
      
      // Leave socket room for this group
      socket.leave(`group_${groupId}`);
      
      console.log(`User ${userId} left group ${groupId}`);
    });
    
    // User is typing
    socket.on('typing', (data) => {
      const { sender, recipient, group } = data;
      
      if (group) {
        // Emit typing event to group
        socket.to(`group_${group}`).emit('user_typing_group', { userId: sender, groupId: group });
      } else {
        // Emit typing event to recipient
        const recipientSocketId = onlineUsers.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('user_typing', { userId: sender });
        }
      }
    });
    
    // User stops typing
    socket.on('stop_typing', (data) => {
      const { sender, recipient, group } = data;
      
      if (group) {
        // Emit stop typing event to group
        socket.to(`group_${group}`).emit('user_stop_typing_group', { userId: sender, groupId: group });
      } else {
        // Emit stop typing event to recipient
        const recipientSocketId = onlineUsers.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('user_stop_typing', { userId: sender });
        }
      }
    });
    
    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, userId, groupId } = data;
        
        if (groupId) {
          // Mark group messages as read
          await Message.updateMany(
            { group: groupId, 'readBy.user': { $ne: userId } },
            { $addToSet: { readBy: { user: userId } } }
          );
          
          // Reset unread count for this user in the group conversation
          await Conversation.findOneAndUpdate(
            { group: groupId },
            { [`unreadCount.${userId}`]: 0 }
          );
        } else {
          // Update conversation to mark messages as read
          await Conversation.findByIdAndUpdate(conversationId, {
            [`unreadCount.${userId}`]: 0
          });
          
          // Get conversation to find the other user
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) return;
          
          // Find the other participant
          const otherUserId = conversation.participants.find(
            id => id.toString() !== userId.toString()
          );
          
          if (!otherUserId) return;
          
          // Mark messages as read
          const updatedMessages = await Message.updateMany(
            { sender: otherUserId, recipient: userId, isRead: false },
            { isRead: true, readAt: Date.now() }
          );
          
          // Notify sender that messages were read
          const otherUserSocketId = onlineUsers.get(otherUserId.toString());
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit('messages_read', { userId });
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Disconnect
    socket.on('disconnect', async () => {
      // Find user by socket ID
      let userId = null;
      for (const [id, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          userId = id;
          break;
        }
      }
      
      if (userId) {
        // Remove user from online users
        onlineUsers.delete(userId);
        
        // Update user status to offline
        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastSeen: Date.now()
        });
        
        // Notify all users about offline status
        io.emit('user_status_change', {
          userId,
          status: 'offline',
          lastSeen: new Date()
        });
        
        console.log(`User ${userId} disconnected`);
      }
    });
  });
};