require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const socketHandler = require("./socket/socketHandler");
const anonymousSocketHandler = require("./socket/anonymousSocketHandler");
const anonymousRoutes = require("./routes/anonymousRoutes");
const startAnonymousCleanupCron = require("./services/anonymousCleanupCron");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Connect MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL, // production
  /\.vercel\.app$/,        // any Vercel preview deployment
  "http://localhost:3000", // local dev
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/privacy", require("./routes/privacyRoutes"));
app.use("/api/invites", require("./routes/inviteRoutes"));
app.use("/api/anonymous", anonymousRoutes);

app.get("/", (req, res) => res.send("ChatApp API running ✅"));

// Socket.IO
socketHandler(io);
anonymousSocketHandler(io);

// Cron jobs
startAnonymousCleanupCron();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));