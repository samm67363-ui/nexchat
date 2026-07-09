# ⚡ NexChat

A full-stack real-time chat application with live messaging, presence, typing indicators, emoji reactions, read receipts, privacy controls, and a fully anonymous "no account needed" chat mode via shareable invite links.

**🔗 Live demo:** [nexchat-rosy.vercel.app](https://nexchat-rosy.vercel.app)

<!--
  TODO: Add a screenshot or GIF here once you're ready. This is the single
  highest-impact thing you can add to this README — a 10-second screen
  recording converted to GIF (use https://ezgif.com/video-to-gif) showing:
  1. Logging in / the main chat UI
  2. Sending a message with a live reply
  3. The anonymous chat flow (generate link → guest joins → chat)

  ![NexChat demo](./docs/demo.gif)
-->

## Features

- 🔐 **Authentication** — Firebase Auth (email/password)
- 💬 **Real-time messaging** — instant delivery via Socket.IO, with sent/delivered/read status
- ⌨️ **Typing indicators** — see when the other person is typing
- 🟢 **Live presence** — online/offline status, with per-user privacy controls to hide your status from specific people
- 😄 **Emoji reactions** — react to any message
- 🔍 **Search & filter** — find conversations and users quickly, with WhatsApp-style filter tabs (All / Unread / Favourites)
- 🕵️ **Anonymous guest chat** — generate a one-time, time-limited invite link; the other person joins with just a nickname, no account required. Fully separate Socket.IO namespace so it never touches the authenticated chat flow.
- 🚩 **Reporting & moderation** — guests and hosts can report an anonymous session
- 🌓 **Light/dark theme**
- 📱 Responsive dark UI throughout

## Tech stack

**Frontend**
- React + Vite
- React Router
- Socket.IO client
- Firebase Authentication (client SDK)

**Backend**
- Node.js + Express
- Socket.IO (two namespaces: default `/` for authenticated chat, `/anonymous` for guest sessions)
- MongoDB + Mongoose
- Firebase Admin SDK (token verification)

**Deployment**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Render](https://render.com)
- Database: MongoDB Atlas

## Architecture notes

- Two independent Socket.IO namespaces keep the anonymous chat feature from ever touching the authenticated session's auth middleware.
- The main namespace maintains an in-memory `userId → socketId` map so the anonymous namespace can push live notifications (e.g. "a guest joined your invite link") to a logged-in host even while they're browsing the regular chat UI, not the anonymous chat page itself.
- Anonymous rooms and messages are TTL-scoped (24h) and fully deleted from the database once a session ends.

## Project structure

```
nexchat/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (chat, sidebar, anonymous chat, etc.)
│   │   ├── context/          # Auth, Chat, and Theme React contexts
│   │   ├── hooks/            # Custom hooks (e.g. useAnonymousSocket)
│   │   ├── pages/            # Route-level pages
│   │   ├── services/         # API and socket client setup
│   │   └── styles/           # CSS
│   └── package.json
├── backend/
│   ├── models/                # Mongoose schemas
│   ├── routes/                # REST API routes
│   ├── socket/                # Socket.IO handlers (main + anonymous namespaces)
│   ├── config/                # Firebase Admin config, etc.
│   └── package.json
└── README.md
```

## Getting started (local setup)

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Firebase project with Authentication enabled (Email/Password provider)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/nexchat.git
cd nexchat
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_client_email
FIREBASE_PRIVATE_KEY="your_firebase_service_account_private_key"
CLIENT_URL=http://localhost:5173
```

> The Firebase service account credentials come from Firebase Console → Project Settings → Service Accounts → Generate new private key.

Start the backend:

```bash
npm run dev
```

The server should log `MongoDB Connected` and `Server running on port 5000`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

> These come from Firebase Console → Project Settings → General → Your apps → Web app config.

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Try it out

- Sign up for two separate accounts (or use two browsers/incognito) to test real-time messaging between users
- From the sidebar, click the invite-link icon to generate an anonymous chat link, then open it in an incognito window to test the guest flow

## Deployment

This project is deployed with:
- **Frontend** on Vercel, auto-deploying from the `frontend/` directory on push to `main`
- **Backend** on Render, auto-deploying from the `backend/` directory on push to `main`

If deploying your own instance, remember to set the same environment variables above in each platform's dashboard, and set `VITE_SOCKET_URL` to your deployed backend's bare origin (no `/api` path).

## License

MIT
