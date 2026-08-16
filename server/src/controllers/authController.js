import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_nexushub_2026_modern_mern',
    { expiresIn: '30d' }
  );
};

// Helper: Generate a clean, guaranteed unique username from name or random words
export const generateUniqueUsername = async (baseName = '') => {
  const coolPrefixes = [
    'nexus', 'cyber', 'pixel', 'nova', 'astro', 'echo', 'flux', 'vortex',
    'shadow', 'cosmic', 'zenith', 'pulse', 'hyper', 'alpha', 'vector', 'spark'
  ];

  let cleaned = (baseName || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (!cleaned || cleaned.length < 3) {
    const randomPrefix = coolPrefixes[Math.floor(Math.random() * coolPrefixes.length)];
    cleaned = `${randomPrefix}_user`;
  }

  // 1. Check if base username is available
  let candidate = cleaned;
  let exists = await User.findOne({ username: candidate });
  if (!exists) return candidate;

  // 2. Try clean numbers (e.g. alex_88, alex_492)
  for (let i = 0; i < 15; i++) {
    const randomNum = Math.floor(100 + Math.random() * 900); // 3 digits
    candidate = `${cleaned}_${randomNum}`;
    exists = await User.findOne({ username: candidate });
    if (!exists) return candidate;
  }

  // 3. Fallback timestamp-based unique suffix
  const timeSuffix = Date.now().toString().slice(-4);
  return `${cleaned}_${timeSuffix}`;
};

// @desc    Suggest or generate a unique username
// @route   GET /api/auth/suggest-username
export const suggestUsername = async (req, res, next) => {
  try {
    const { name = '' } = req.query;
    const uniqueUsername = await generateUniqueUsername(name.toString());
    res.status(200).json({
      success: true,
      username: uniqueUsername,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    let { name, username, email, password, avatar, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password',
      });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Auto-generate username if not supplied or if taken
    if (!username || !username.trim()) {
      username = await generateUniqueUsername(name);
    } else {
      username = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        // Automatically generate unique variation
        username = await generateUniqueUsername(username);
      }
    }

    const defaultAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    const user = await User.create({
      name,
      username,
      email: email.toLowerCase(),
      password,
      avatar: defaultAvatar,
      bio: bio || 'Hello! I am excited to connect on NexusHub.',
      isOnline: true,
      lastSeen: new Date(),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        isOnline: user.isOnline,
        friends: user.friends,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.',
      });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        isOnline: user.isOnline,
        friends: user.friends,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name username avatar isOnline lastSeen');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, username, bio, avatar, location, statusMessage, website, coverImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username && username.toLowerCase() !== user.username) {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      const taken = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (taken) {
        return res.status(400).json({ success: false, message: 'This username is already taken by another user' });
      }
      user.username = cleanUsername;
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (location !== undefined) user.location = location;
    if (statusMessage !== undefined) user.statusMessage = statusMessage;
    if (website !== undefined) user.website = website;
    if (coverImage) user.coverImage = coverImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick demo user login (Alice, Bob, Charlie)
// @route   POST /api/auth/demo-login
export const demoLogin = async (req, res, next) => {
  try {
    const { username } = req.body;
    const targetUsername = (username || 'alice').toLowerCase();

    let user = await User.findOne({ username: targetUsername });
    if (!user) {
      const names = {
        alice: 'Alice Vance',
        bob: 'Bob Sterling',
        charlie: 'Charlie Chen',
      };
      user = await User.create({
        name: names[targetUsername] || `${targetUsername.toUpperCase()} Demo`,
        username: targetUsername,
        email: `${targetUsername}@nexushub.dev`,
        password: 'password123',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUsername}`,
        bio: `Hi! I'm ${names[targetUsername] || targetUsername} using the NexusHub demo account.`,
        isOnline: true,
        lastSeen: new Date(),
      });
    } else {
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        isOnline: user.isOnline,
        friends: user.friends,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
