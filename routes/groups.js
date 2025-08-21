const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Get all groups for current user
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Find groups where user is a member
    const groups = await Group.find({
      members: req.user._id
    })
    .populate('creator', 'name avatar')
    .populate('members', 'name avatar status')
    .sort({ updatedAt: -1 });
    
    res.render('groups', {
      user: req.user,
      groups
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load groups');
    res.redirect('/dashboard');
  }
});

// Create new group
router.post('/create', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    // Validate input
    if (!name) {
      req.flash('error_msg', 'Group name is required');
      return res.redirect('/groups');
    }
    
    // Normalize members input - it may be undefined, a string, or array
    let memberIds = [];
    if (members) {
      if (Array.isArray(members)) memberIds = members.map(String);
      else memberIds = [String(members)];
    }

    // Ensure creator is member and dedupe
    memberIds = Array.from(new Set([String(req.user._id), ...memberIds]));

    // Create new group
    const newGroup = new Group({
      name,
      description,
      creator: req.user._id,
      members: memberIds,
      admins: [req.user._id]
    });
    
    await newGroup.save();
    
    // Create conversation for this group
    const conversation = new Conversation({
      group: newGroup._id
    });
    
    await conversation.save();
    
    req.flash('success_msg', 'Group created successfully');
    res.redirect('/groups');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to create group');
    res.redirect('/groups');
  }
});

// Get group details
router.get('/:groupId', ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Get group details
    const group = await Group.findById(groupId)
      .populate('creator', 'name avatar')
      .populate('members', 'name avatar status')
      .populate('admins', 'name avatar');
    
    if (!group) {
      req.flash('error_msg', 'Group not found');
      return res.redirect('/groups');
    }
    
    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      req.flash('error_msg', 'You are not a member of this group');
      return res.redirect('/groups');
    }
    
    // Get conversation for this group
    const conversation = await Conversation.findOne({ group: groupId });
    
    // Get messages for this group
    const messages = await Message.find({ group: groupId })
      .populate('sender', 'name avatar')
      .populate('attachments')
      .sort({ createdAt: 1 });
    
    res.render('group-chat', {
      user: req.user,
      group,
      conversation,
      messages
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load group');
    res.redirect('/groups');
  }
});

// Add members to group
router.post('/:groupId/members', ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { members } = req.body;
    
    // Get group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is admin
    const adminIds = group.admins.map(id => id.toString());
    if (!adminIds.includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }
    
    // Normalize incoming members
    let incoming = [];
    if (members) {
      if (Array.isArray(members)) incoming = members.map(String);
      else incoming = [String(members)];
    }

    // Add new members (avoid duplicates)
    const existing = group.members.map(id => id.toString());
    const newMembers = incoming.filter(id => !existing.includes(id));
    group.members.push(...newMembers);
    
    await group.save();
    
    res.json({ success: true, members: group.members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// Remove member from group
router.delete('/:groupId/members/:memberId', ensureAuthenticated, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    
    // Get group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is admin or removing themselves
    const adminIdsDel = group.admins.map(id => id.toString());
    if (!adminIdsDel.includes(req.user._id.toString()) && req.user._id.toString() !== memberId) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }
    
    // Remove member
    group.members = group.members.filter(id => id.toString() !== memberId);
    
    // If admin is removed, remove from admins as well
    if (group.admins.map(id => id.toString()).includes(memberId)) {
      group.admins = group.admins.filter(id => id.toString() !== memberId);
    }
    
    await group.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;