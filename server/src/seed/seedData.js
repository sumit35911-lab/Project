import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Notification } from '../models/Notification.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexushub';

export const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUri);

    console.log('Clearing existing records...');
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      FriendRequest.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Seeding demo users...');
    const users = await User.create([
      {
        name: 'Alice Vance',
        username: 'alice',
        email: 'alice@nexushub.dev',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        bio: 'Product Designer & Fullstack Enthusiast ✨ Crafting delightful digital spaces and real-time experiences.',
        location: 'San Francisco, CA',
        statusMessage: 'Designing the future of collaborative spaces 🎨',
        isOnline: true,
      },
      {
        name: 'Bob Sterling',
        username: 'bob',
        email: 'bob@nexushub.dev',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        bio: 'Distributed Systems & Cloud Engineer. Exploring WebSockets, microservices and AI agents 🚀',
        location: 'Seattle, WA',
        statusMessage: 'Building high-throughput real-time pipelines ⚡',
        isOnline: true,
      },
      {
        name: 'Charlie Chen',
        username: 'charlie',
        email: 'charlie@nexushub.dev',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
        coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
        bio: 'Creative Technologist & Open Source Contributor. Coffee lover ☕ and dark mode advocate.',
        location: 'Austin, TX',
        statusMessage: 'Coding late night beats and UI shaders 💻',
        isOnline: false,
      },
      {
        name: 'Elena Rostova',
        username: 'elena',
        email: 'elena@nexushub.dev',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
        bio: 'AI Researcher & Data Scientist. Exploring LLM capabilities and human-computer interactions 🧠',
        location: 'Boston, MA',
        statusMessage: 'Training neural networks & reading arXiv 📚',
        isOnline: false,
      },
    ]);

    const [alice, bob, charlie, elena] = users;

    console.log('Establishing mutual friendships...');
    alice.friends = [bob._id, charlie._id];
    bob.friends = [alice._id, charlie._id];
    charlie.friends = [alice._id, bob._id];
    await Promise.all([alice.save(), bob.save(), charlie.save()]);

    console.log('Creating sample posts...');
    const post1 = await Post.create({
      author: alice._id,
      content: '🚀 Super excited to unveil NexusHub! A fully responsive modern space to share our thoughts, connect with friends, and chat in real-time. What do you all think of the interface?',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      tags: ['NexusHub', 'React', 'Design', 'WebSockets'],
      mood: '🚀 Building',
      likes: [bob._id, charlie._id],
      commentsCount: 2,
    });

    const post2 = await Post.create({
      author: bob._id,
      content: '⚡ Just benchmarked the real-time Socket.IO synchronization on NexusHub. Instant message dispatch and sub-50ms latency across client nodes. Truly smooth experience!',
      image: '',
      tags: ['WebSockets', 'MERN', 'Engineering'],
      mood: '⚡ Performance',
      likes: [alice._id],
      commentsCount: 1,
    });

    const post3 = await Post.create({
      author: charlie._id,
      content: '☕ Sunday morning coffee & clean architectural designs. There is something deeply satisfying about fluid responsive UIs that feel natural on mobile phones and wide desktop monitors alike.',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      tags: ['DesignLife', 'CleanCode', 'Aesthetics'],
      mood: '☕ Chill',
      likes: [alice._id, bob._id],
      commentsCount: 0,
    });

    console.log('Creating sample comments...');
    await Comment.create([
      {
        post: post1._id,
        author: bob._id,
        content: 'Looks incredibly slick Alice! The micro-animations and typography hierarchy are top-tier.',
      },
      {
        post: post1._id,
        author: charlie._id,
        content: 'Love the instant messaging and feed responsiveness on both my phone and desktop!',
      },
      {
        post: post2._id,
        author: alice._id,
        content: 'The low-latency sockets make 1-on-1 and group chats feel like native desktop apps 👏',
      },
    ]);

    console.log('Creating sample conversations...');
    // 1-on-1 Chat between Alice and Bob
    const directChat = await Conversation.create({
      isGroup: false,
      participants: [alice._id, bob._id],
      lastMessage: {
        text: 'Hey Bob, did you see the new real-time post feed updates?',
        sender: alice._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    });

    await Message.create([
      {
        conversation: directChat._id,
        sender: bob._id,
        text: 'Hey Alice! Hope you are having a productive day.',
        readBy: [bob._id, alice._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        conversation: directChat._id,
        sender: alice._id,
        text: 'Hey Bob, did you see the new real-time post feed updates?',
        readBy: [alice._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    ]);

    // Group Chat: "🚀 Nexus Pioneers"
    const groupChat = await Conversation.create({
      isGroup: true,
      name: '🚀 Nexus Pioneers Club',
      description: 'The core creator community for NexusHub innovators and designers.',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80',
      admin: alice._id,
      participants: [alice._id, bob._id, charlie._id],
      lastMessage: {
        text: 'Welcome everyone! Feel free to share your thoughts and collaborate.',
        sender: alice._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    });

    await Message.create([
      {
        conversation: groupChat._id,
        sender: alice._id,
        text: '🎉 Welcome to the Nexus Pioneers group room!',
        messageType: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        conversation: groupChat._id,
        sender: bob._id,
        text: 'Great to be here! Looking forward to testing group messaging.',
        readBy: [bob._id, alice._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 20),
      },
      {
        conversation: groupChat._id,
        sender: charlie._id,
        text: 'The group chat features are super smooth. Let us build something awesome!',
        readBy: [charlie._id, alice._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        conversation: groupChat._id,
        sender: alice._id,
        text: 'Welcome everyone! Feel free to share your thoughts and collaborate.',
        readBy: [alice._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    ]);

    console.log('Creating sample notifications...');
    await Notification.create([
      {
        recipient: alice._id,
        sender: bob._id,
        type: 'post_like',
        message: 'Bob Sterling liked your thought',
        referenceId: post1._id,
        isRead: false,
      },
      {
        recipient: alice._id,
        sender: charlie._id,
        type: 'post_comment',
        message: 'Charlie Chen commented on your thought',
        referenceId: post1._id,
        isRead: false,
      },
    ]);

    console.log('\x1b[32m✔ NexusHub database seeded successfully with users (Alice, Bob, Charlie), posts, chats and messages!\x1b[0m');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (process.argv[1]?.includes('seedData.js')) {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
};

if (process.argv[1]?.includes('seedData.js')) {
  seedDatabase();
}
