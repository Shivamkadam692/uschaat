const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that either participants or group is provided
ConversationSchema.pre('validate', function(next) {
  if ((!this.participants || this.participants.length === 0) && !this.group) {
    this.invalidate('participants', 'Either participants or group must be provided');
  }
  next();
});

// Create index for faster queries
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ group: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;