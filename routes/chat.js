const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Chat main page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get all conversations for current user
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate({
      path: 'participants',
      select: 'name email avatar status lastSeen'
    })
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender'
    })
    .sort({ updatedAt: -1 });
    
    // Get all users except current user for new chats
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email avatar status lastSeen');
    
    res.render('chat', {
      user: req.user,
      conversations,
      users
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load chat');
    res.redirect('/dashboard');
  }
});

// Get conversation with specific user
router.get('/conversation/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;
    
    // Get or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    });
    
    if (!conversation) {
      // Create new conversation if it doesn't exist
      conversation = new Conversation({
        participants: [currentUserId, otherUserId]
      });
      await conversation.save();
    }
    
    // Get messages for this conversation
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });
    
    // Get other user details
    const otherUser = await User.findById(otherUserId)
      .select('name email avatar status lastSeen');
    
    // Mark messages as read
    await Message.updateMany(
      { 
        sender: otherUserId,
        recipient: currentUserId,
        isRead: false 
      },
      { 
        isRead: true,
        readAt: Date.now() 
      }
    );
    
    // Reset unread count
    await Conversation.findByIdAndUpdate(conversation._id, {
      [`unreadCount.${currentUserId}`]: 0
    });
    
    res.json({
      conversation: conversation._id,
      messages,
      user: otherUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// Search users
router.get('/search', ensureAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.term;
    
    if (!searchTerm) {
      return res.json([]);
    }
    
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name email avatar status')
    .limit(10);
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;