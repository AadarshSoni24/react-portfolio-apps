// ============================================================
// PROJECT 4: NOTES APP — BACKEND (Node.js + Express + MongoDB + JWT)
// This is the backend server for the Notes App
//
// HOW TO RUN:
// 1. npm init -y
// 2. npm install express mongoose jsonwebtoken bcryptjs cors dotenv
// 3. Install MongoDB: https://www.mongodb.com/try/download/community
//    OR use MongoDB Atlas (free cloud): https://www.mongodb.com/atlas
// 4. node 04-notes-backend.js
// Server runs at http://localhost:5000
//
// API ENDPOINTS:
// POST   /api/auth/signup     → Register new user
// POST   /api/auth/login      → Login, get JWT token
// GET    /api/auth/me         → Get current user (protected)
// GET    /api/notes           → Get all notes (protected)
// POST   /api/notes           → Create note (protected)
// PATCH  /api/notes/:id       → Update note (protected)
// DELETE /api/notes/:id       → Delete note (protected)
// ============================================================

const express  = require("express");
const mongoose = require("mongoose");
const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const cors     = require("cors");

require("dotenv").config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─── Config ───────────────────────────────────────────────────
const MONGO_URI  = process.env.MONGO_URI  || "mongodb://localhost:27017/notevault";
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_change_in_production";
const PORT       = process.env.PORT       || 5000;

// ─── Database Connection ──────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

// ─── Schemas & Models ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  createdAt: { type: Date,   default: Date.now },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const noteSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:     { type: String, default: "" },
  content:   { type: String, required: true },
  color:     { type: String, default: "#fff" },
  pinned:    { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);

// ─── Auth Middleware ──────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ─── Helper: Generate Token ───────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

// ─── Auth Routes ──────────────────────────────────────────────

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user  = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — protected
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

// ─── Notes Routes ─────────────────────────────────────────────

// GET /api/notes — get all notes for current user
app.get("/api/notes", authenticate, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id })
      .sort({ pinned: -1, updatedAt: -1 }); // pinned first, then newest
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes — create a new note
app.post("/api/notes", authenticate, async (req, res) => {
  try {
    const { title, content, color } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const note = await Note.create({
      user: req.user._id,
      title: title || "",
      content,
      color: color || "#fff",
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notes/:id — update a note
app.patch("/api/notes/:id", authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });

    const { title, content, color, pinned } = req.body;
    if (title   !== undefined) note.title   = title;
    if (content !== undefined) note.content = content;
    if (color   !== undefined) note.color   = color;
    if (pinned  !== undefined) note.pinned  = pinned;

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id
app.delete("/api/notes/:id", authenticate, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 API docs:`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/notes`);
  console.log(`   POST   /api/notes`);
  console.log(`   PATCH  /api/notes/:id`);
  console.log(`   DELETE /api/notes/:id`);
});
