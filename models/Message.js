const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that either recipient or group is provided
MessageSchema.pre('validate', function(next) {
  if (!this.recipient && !this.group) {
    this.invalidate('recipient', 'Either recipient or group must be provided');
  }
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    this.invalidate('content', 'Either content or attachments must be provided');
  }
  next();
});

// Create index for faster queries
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ group: 1, createdAt: -1 });

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;