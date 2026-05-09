// ============================================================
// PROJECT 2: TODO APP with localStorage
// Stack: React, useState, useEffect, localStorage
// Concepts: CRUD operations, data persistence, filtering, form handling
//
// HOW TO RUN:
// 1. npx create-react-app todo-app
// 2. Replace src/App.js content with this file
// 3. npm start
// ============================================================

import { useState, useEffect, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────
const FILTERS = ["All", "Active", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

const PRIORITY_COLORS = {
  Low:    { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e" },
  Medium: { bg: "#fef9c3", text: "#ca8a04", dot: "#eab308" },
  High:   { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
};

// ─── Helper ──────────────────────────────────────────────────
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Sub-Components ──────────────────────────────────────────
function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef(null);

  const saveEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") { setEditText(todo.text); setEditing(false); }
  };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const p = PRIORITY_COLORS[todo.priority];

  return (
    <div style={{
      ...styles.todoItem,
      opacity: todo.completed ? 0.6 : 1,
      borderLeft: `4px solid ${p.dot}`,
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        style={{ ...styles.checkbox, borderColor: p.dot, background: todo.completed ? p.dot : "transparent" }}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && <span style={styles.checkmark}>✓</span>}
      </button>

      {/* Content */}
      <div style={styles.todoContent}>
        {editing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            style={styles.editInput}
          />
        ) : (
          <span style={{ ...styles.todoText, textDecoration: todo.completed ? "line-through" : "none" }}>
            {todo.text}
          </span>
        )}

        <div style={styles.todoMeta}>
          <span style={{ ...styles.priorityBadge, background: p.bg, color: p.text }}>
            {todo.priority}
          </span>
          {todo.category && (
            <span style={styles.categoryBadge}>#{todo.category}</span>
          )}
          <span style={styles.dateText}>
            {new Date(todo.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.todoActions}>
        {!todo.completed && (
          <button onClick={() => setEditing(true)} style={styles.actionBtn} aria-label="Edit">✏️</button>
        )}
        <button onClick={() => onDelete(todo.id)} style={{ ...styles.actionBtn, ...styles.deleteBtn }} aria-label="Delete">🗑️</button>
      </div>
    </div>
  );
}

function AddTodoForm({ onAdd }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), priority, category: category.trim().toLowerCase() });
    setText("");
    setCategory("");
    setPriority("Medium");
    setExpanded(false);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.addForm}>
      <div style={styles.addRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Add a new task..."
          style={styles.addInput}
          required
        />
        <button type="submit" style={styles.addBtn}>+ Add</button>
      </div>

      {expanded && (
        <div style={styles.addOptions}>
          <div>
            <label style={styles.optionLabel}>Priority</label>
            <div style={styles.priorityButtons}>
              {PRIORITIES.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    ...styles.priorityBtn,
                    background: priority === p ? PRIORITY_COLORS[p].dot : "#f3f4f6",
                    color: priority === p ? "#fff" : "#6b7280",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={styles.optionLabel}>Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="work, personal, study..."
              style={styles.categoryInput}
            />
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function TodoApp() {
  const [todos, setTodos] = useState(() => {
    // Initialize from localStorage
    try {
      const saved = localStorage.getItem("todos-v1");
      return saved ? JSON.parse(saved) : DEMO_TODOS;
    } catch {
      return DEMO_TODOS;
    }
  });

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | priority

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem("todos-v1", JSON.stringify(todos));
  }, [todos]);

  // CRUD Operations
  const addTodo = ({ text, priority, category }) => {
    const newTodo = {
      id: generateId(),
      text,
      priority,
      category,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const editTodo = (id, newText) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  // Filtering + Searching + Sorting
  const filtered = todos
    .filter(t => {
      if (filter === "Active") return !t.completed;
      if (filter === "Completed") return t.completed;
      return true;
    })
    .filter(t => t.text.toLowerCase().includes(search.toLowerCase()) ||
                 t.category.includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "priority") {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  };

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>✅ TaskFlow</h1>
            <p style={styles.subtitle}>Stay organised, ship more.</p>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.stat}><span style={styles.statNum}>{stats.active}</span><span style={styles.statLbl}>Active</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{stats.completed}</span><span style={styles.statLbl}>Done</span></div>
            <div style={styles.stat}><span style={styles.statNum}>{stats.total}</span><span style={styles.statLbl}>Total</span></div>
          </div>
        </header>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            <span style={styles.progressText}>{Math.round(progress)}% complete</span>
          </div>
        )}

        {/* Add Form */}
        <AddTodoForm onAdd={addTodo} />

        {/* Controls */}
        <div style={styles.controls}>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search tasks..."
            style={styles.searchInput}
          />

          {/* Filter Tabs */}
          <div style={styles.filterTabs}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...styles.filterTab, ...(filter === f ? styles.filterTabActive : {}) }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.sortSelect}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">By priority</option>
          </select>
        </div>

        {/* Todo List */}
        <div style={styles.todoList}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📋</span>
              <p>{search ? "No tasks match your search." : "No tasks here. Add one above!"}</p>
            </div>
          ) : (
            filtered.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {stats.completed > 0 && (
          <div style={styles.footer}>
            <span style={styles.footerText}>{stats.completed} task{stats.completed > 1 ? "s" : ""} completed</span>
            <button onClick={clearCompleted} style={styles.clearBtn}>Clear completed</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo data so app starts with content
const DEMO_TODOS = [
  { id: "1", text: "Build weather app with API integration", priority: "High", category: "project", completed: false, createdAt: Date.now() - 3600000 },
  { id: "2", text: "Learn React hooks thoroughly", priority: "High", category: "study", completed: true, createdAt: Date.now() - 7200000 },
  { id: "3", text: "Push all projects to GitHub", priority: "Medium", category: "work", completed: false, createdAt: Date.now() - 1800000 },
  { id: "4", text: "Read about useReducer pattern", priority: "Low", category: "study", completed: false, createdAt: Date.now() - 900000 },
];

// ─── Styles ──────────────────────────────────────────────────
const styles = {
  app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 680, margin: "0 auto", padding: "32px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#94a3b8", margin: "4px 0 0" },
  statsRow: { display: "flex", gap: 16 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: 700, color: "#0f172a" },
  statLbl: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  progressBar: { background: "#e2e8f0", borderRadius: 99, height: 8, marginBottom: 24, position: "relative", overflow: "visible" },
  progressFill: { background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 99, height: "100%", transition: "width 0.5s ease" },
  progressText: { position: "absolute", right: 0, top: -20, fontSize: 12, color: "#64748b" },
  addForm: { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  addRow: { display: "flex", gap: 10 },
  addInput: { flex: 1, border: "2px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 15, outline: "none", transition: "border 0.2s" },
  addBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" },
  addOptions: { display: "flex", flexDirection: "column", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" },
  optionLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 },
  priorityButtons: { display: "flex", gap: 8 },
  priorityBtn: { padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" },
  categoryInput: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
  controls: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  searchInput: { border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  filterTabs: { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 },
  filterTab: { flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#64748b", transition: "all 0.2s" },
  filterTabActive: { background: "#fff", color: "#6366f1", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  sortSelect: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", color: "#374151" },
  todoList: { display: "flex", flexDirection: "column", gap: 10 },
  todoItem: { background: "#fff", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #f1f5f9", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 0.2s" },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: 700 },
  todoContent: { flex: 1, minWidth: 0 },
  todoText: { fontSize: 15, color: "#0f172a", display: "block", marginBottom: 4 },
  todoMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  priorityBadge: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: 0.5 },
  categoryBadge: { fontSize: 12, color: "#6366f1", fontWeight: 500 },
  dateText: { fontSize: 11, color: "#94a3b8" },
  todoActions: { display: "flex", gap: 4 },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6, opacity: 0.6, transition: "opacity 0.2s" },
  deleteBtn: { opacity: 0.4 },
  editInput: { width: "100%", border: "2px solid #6366f1", borderRadius: 8, padding: "4px 10px", fontSize: 15, outline: "none", boxSizing: "border-box" },
  emptyState: { textAlign: "center", padding: "48px 24px", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, padding: "12px 0", borderTop: "1px solid #f1f5f9" },
  footerText: { fontSize: 13, color: "#94a3b8" },
  clearBtn: { fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },
};
