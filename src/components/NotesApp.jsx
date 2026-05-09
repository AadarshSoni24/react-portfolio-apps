// ============================================================
// PROJECT 4: NOTES APP WITH AUTH (FRONTEND)
// Stack: React, Context API, useState, useEffect, Fetch API
// Concepts: Authentication flow, protected routes, Context, custom hooks
//
// This is the frontend. It expects a backend running at http://localhost:5000
// The backend code is in 04-notes-backend.js
//
// HOW TO RUN:
// 1. First run the backend: node 04-notes-backend.js
// 2. npx create-react-app notes-app
// 3. Replace src/App.js with this file
// 4. npm start
// ============================================================

import { useState, useEffect, useContext, createContext, useCallback } from "react";

const API = "http://localhost:5000/api";

// ─── Auth Context ─────────────────────────────────────────────
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Notes Hook ───────────────────────────────────────────────
function useNotes(token) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/notes`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async (title, content, color) => {
    const res = await fetch(`${API}/notes`, {
      method: "POST", headers,
      body: JSON.stringify({ title, content, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setNotes(prev => [data, ...prev]);
  };

  const updateNote = async (id, updates) => {
    const res = await fetch(`${API}/notes/${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setNotes(prev => prev.map(n => n._id === id ? data : n));
  };

  const deleteNote = async (id) => {
    const res = await fetch(`${API}/notes/${id}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error("Delete failed");
    setNotes(prev => prev.filter(n => n._id !== id));
  };

  return { notes, loading, error, createNote, updateNote, deleteNote };
}

// ─── Auth Forms ───────────────────────────────────────────────
function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) throw new Error("Name is required");
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters");
        await signup(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.authPage}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>📒</div>
        <h1 style={styles.authTitle}>NoteVault</h1>
        <p style={styles.authSubtitle}>Your personal notes, secured.</p>

        {/* Toggle */}
        <div style={styles.authToggle}>
          <button onClick={() => setMode("login")} style={{ ...styles.authToggleBtn, ...(mode === "login" ? styles.authToggleActive : {}) }}>Log In</button>
          <button onClick={() => setMode("signup")} style={{ ...styles.authToggleBtn, ...(mode === "signup" ? styles.authToggleActive : {}) }}>Sign Up</button>
        </div>

        {error && <div style={styles.authError}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div style={styles.formGroup}>
              <label style={styles.authLabel}>Full Name</label>
              <input value={form.name} onChange={set("name")} placeholder="Raj Kumar" style={styles.authInput} required />
            </div>
          )}
          <div style={styles.formGroup}>
            <label style={styles.authLabel}>Email</label>
            <input value={form.email} onChange={set("email")} type="email" placeholder="raj@example.com" style={styles.authInput} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.authLabel}>Password</label>
            <input value={form.password} onChange={set("password")} type="password" placeholder="••••••••" style={styles.authInput} required />
          </div>
          <button type="submit" disabled={submitting} style={{ ...styles.authSubmitBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Loading..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 16 }}>
          Demo: test@example.com / password123
        </p>
      </div>
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────
const NOTE_COLORS = ["#fff", "#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#ede9fe", "#ffedd5"];

function NoteCard({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const save = async () => {
    await onUpdate(note._id, { title, content });
    setEditing(false);
  };

  return (
    <div style={{ ...styles.noteCard, background: note.color || "#fff" }}>
      {editing ? (
        <>
          <input value={title} onChange={e => setTitle(e.target.value)} style={styles.noteEditTitle} placeholder="Title..." />
          <textarea value={content} onChange={e => setContent(e.target.value)} style={styles.noteEditContent} placeholder="Write your note..." rows={6} />
          <div style={styles.noteActions}>
            <button onClick={save} style={styles.saveNoteBtn}>Save</button>
            <button onClick={() => { setTitle(note.title); setContent(note.content); setEditing(false); }} style={styles.cancelBtn}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h3 style={styles.noteTitle}>{note.title || "Untitled"}</h3>
          <p style={styles.noteContent}>{note.content}</p>
          <div style={styles.noteMeta}>
            <span style={styles.noteDate}>{new Date(note.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <div style={styles.noteActions}>
              <button onClick={() => setEditing(true)} style={styles.noteActionBtn} title="Edit">✏️</button>
              <button onClick={() => onDelete(note._id)} style={styles.noteActionBtn} title="Delete">🗑️</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CreateNoteCard({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#fff");

  const submit = async () => {
    if (!content.trim()) return;
    await onCreate(title, content, color);
    setTitle(""); setContent(""); setColor("#fff"); setOpen(false);
  };

  if (!open) {
    return (
      <div onClick={() => setOpen(true)} style={styles.createNotePlaceholder}>
        <span>+ Take a note...</span>
      </div>
    );
  }

  return (
    <div style={{ ...styles.noteCard, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", background: color }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={styles.noteEditTitle} autoFocus />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Take a note..." style={styles.noteEditContent} rows={4} />
      <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
        {NOTE_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: color === c ? "2px solid #6366f1" : "1px solid #e2e8f0", cursor: "pointer" }} />
        ))}
      </div>
      <div style={styles.noteActions}>
        <button onClick={submit} style={styles.saveNoteBtn}>Add Note</button>
        <button onClick={() => setOpen(false)} style={styles.cancelBtn}>Discard</button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard() {
  const { user, logout, token } = useAuth();
  const { notes, loading, error, createNote, updateNote, deleteNote } = useNotes(token);
  const [search, setSearch] = useState("");

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.dashboard}>
      {/* Top Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <span style={{ fontSize: 24 }}>📒</span>
          <span style={styles.navTitle}>NoteVault</span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search notes..." style={styles.navSearch} />
        <div style={styles.navRight}>
          <span style={styles.navUser}>👤 {user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Log out</button>
        </div>
      </nav>

      <div style={styles.dashContent}>
        {/* Stats Banner */}
        <div style={styles.statsBanner}>
          <span>📒 {notes.length} notes</span>
          <span>🔍 {filtered.length} showing</span>
        </div>

        {/* Create Note */}
        <CreateNoteCard onCreate={createNote} />

        {/* Notes Grid */}
        {loading && <div style={styles.centered}>Loading notes...</div>}
        {error && <div style={styles.errorBanner}>{error}</div>}

        {!loading && filtered.length === 0 && (
          <div style={styles.emptyNotes}>
            <span style={{ fontSize: 48 }}>📝</span>
            <p>{search ? "No notes match your search." : "No notes yet. Create your first one above!"}</p>
          </div>
        )}

        <div style={styles.notesGrid}>
          {filtered.map(note => (
            <NoteCard key={note._id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.centered}>Loading...</div>;
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  authPage: { minHeight: "100vh", background: "linear-gradient(135deg, #e0e7ff 0%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Segoe UI', sans-serif" },
  authCard: { background: "#fff", borderRadius: 24, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.1)" },
  authLogo: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  authTitle: { textAlign: "center", fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 },
  authSubtitle: { textAlign: "center", fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  authToggle: { display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 24 },
  authToggleBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#64748b" },
  authToggleActive: { background: "#fff", color: "#6366f1", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  authError: { background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 },
  authLabel: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" },
  authInput: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" },
  authSubmitBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer", fontSize: 15 },
  formGroup: { display: "flex", flexDirection: "column", gap: 4 },
  dashboard: { minHeight: "100vh", background: "#fafafa", fontFamily: "'Segoe UI', sans-serif" },
  nav: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 },
  navLeft: { display: "flex", alignItems: "center", gap: 8 },
  navTitle: { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  navSearch: { flex: 1, maxWidth: 400, border: "1px solid #e2e8f0", borderRadius: 99, padding: "8px 16px", fontSize: 14, outline: "none", background: "#f8fafc" },
  navRight: { display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" },
  navUser: { fontSize: 14, color: "#374151", fontWeight: 500 },
  logoutBtn: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", background: "transparent", cursor: "pointer", fontSize: 13, color: "#64748b" },
  dashContent: { maxWidth: 1100, margin: "0 auto", padding: "24px 20px" },
  statsBanner: { display: "flex", gap: 16, fontSize: 13, color: "#94a3b8", marginBottom: 16 },
  createNotePlaceholder: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 24, cursor: "text", color: "#94a3b8", fontSize: 15, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 16 },
  noteCard: { borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s" },
  noteTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  noteContent: { fontSize: 14, color: "#374151", lineHeight: 1.6, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden" },
  noteMeta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  noteDate: { fontSize: 11, color: "#94a3b8" },
  noteActions: { display: "flex", gap: 4 },
  noteActionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "2px 4px", opacity: 0.6 },
  noteEditTitle: { width: "100%", border: "none", borderBottom: "1px solid #e2e8f0", padding: "4px 0 8px", fontSize: 16, fontWeight: 700, outline: "none", background: "transparent", marginBottom: 8, boxSizing: "border-box" },
  noteEditContent: { width: "100%", border: "none", fontSize: 14, lineHeight: 1.6, outline: "none", resize: "none", background: "transparent", marginBottom: 8, boxSizing: "border-box" },
  saveNoteBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  cancelBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b" },
  centered: { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", fontSize: 16, color: "#94a3b8" },
  errorBanner: { background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: 14, color: "#dc2626", marginBottom: 16 },
  emptyNotes: { textAlign: "center", padding: 60, color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
};
