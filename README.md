# NexusHub — Modern Fullstack MERN Social & Real-time Messaging Network

NexusHub is a responsive web application built with the **MERN** stack (MongoDB, Express, React, Node.js) and **Socket.IO** for live real-time interactions across mobile, tablet, and desktop screens.

---

## ✨ Key Features

- 💬 **Real-time 1-on-1 & Group Messaging**
  - Instant message delivery powered by Socket.IO
  - Live typing indicator (`"Alice is typing..."`)
  - Create and manage multi-member Group Rooms with topic & avatar
  - Image attachments and quick emoji picker
  - Unread badge counters

- 👥 **Friend & Connection System**
  - Search members and creators across the network
  - Send, Accept, and Decline friend requests
  - Interactive "My Friends" grid with live Online/Offline status dots
  - 1-click Direct Message from any user profile or connection card

- 📰 **Social Feed & "Share Your Thoughts"**
  - Rich thought composer with mood selectors (💡 Thought, 🚀 Building, ☕ Chill, etc.), photo attachments, and clickable hashtags
  - Real-time like animations and counters
  - Threaded comment section with live comment broadcasting
  - Feed filters: *All Thoughts*, *Friends Only*, *Media Only*, and *Tag filtering*

- 👤 **Customizable Profiles & Activity Center**
  - Cover banners, avatars, bios, locations, and joined dates
  - User thoughts timeline
  - Live notification alerts for likes, comments, friend requests, and group invites

- 🎨 **Responsive Aesthetics & Theming**
  - Dark & Light mode toggle with smooth theme transition
  - Multi-column desktop layout + floating mobile bottom navigation bar
  - 1-Click Multi-User Demo Switcher (Alice, Bob, Charlie) to test real-time chat across tabs instantly

---

## 🚀 Quick Start

### 1. Configure MongoDB Connection

In `server/.env`, verify your MongoDB connection string:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/nexushub
JWT_SECRET=super_secret_jwt_key_nexushub_2026_modern_mern
CLIENT_URL=http://localhost:5173
```
*(Or point to your MongoDB Atlas cluster URI).*

---

### 2. Run Backend Server

```bash
cd server
npm start
```
The server will start on `http://localhost:5000` and automatically populate initial demo data on first launch.

*(Optional manual seed reset: `npm run seed` in `server/`)*

---

### 3. Run Frontend React App

In a separate terminal:
```bash
cd client
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Testing Real-time Chatting Across Multiple Users

1. Open `http://localhost:5173` in a regular browser window and click **Alice** on the sign-in screen.
2. Open `http://localhost:5173` in an Incognito / private window and click **Bob**.
3. Go to **Messages & Groups** on both windows:
   - Notice the green online status indicator lights up.
   - Send a direct message from Alice to Bob: it appears instantly without page refresh!
   - Type in the input box: the live typing indicator displays in real time.
   - Switch to the group room **"🚀 Nexus Pioneers Club"** and chat with multiple members.
