// ============================================================
// PROJECT 3: EXPENSE TRACKER
// Stack: React, useState, useEffect, localStorage, recharts
// Concepts: Complex state, data viz, form validation, data aggregation
//
// HOW TO RUN:
// 1. npx create-react-app expense-tracker
// 2. npm install recharts
// 3. Replace src/App.js with this file
// 4. npm start
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── Constants ───────────────────────────────────────────────
const CATEGORIES = [
  { name: "Food",        icon: "🍕", color: "#f59e0b" },
  { name: "Transport",   icon: "🚗", color: "#3b82f6" },
  { name: "Shopping",    icon: "🛍️", color: "#ec4899" },
  { name: "Bills",       icon: "💡", color: "#8b5cf6" },
  { name: "Health",      icon: "🏥", color: "#10b981" },
  { name: "Education",   icon: "📚", color: "#06b6d4" },
  { name: "Entertain",   icon: "🎬", color: "#f97316" },
  { name: "Other",       icon: "💼", color: "#6b7280" },
];

const getCategoryInfo = (name) => CATEGORIES.find(c => c.name === name) || CATEGORIES[7];
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Sub-Components ──────────────────────────────────────────
function SummaryCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ ...styles.summaryCard, borderTop: `3px solid ${color}` }}>
      <div style={styles.summaryTop}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ ...styles.summaryValue, color }}>{value}</div>
      {sub && <div style={styles.summarySub}>{sub}</div>}
    </div>
  );
}

function ExpenseItem({ expense, onDelete }) {
  const cat = getCategoryInfo(expense.category);
  return (
    <div style={styles.expenseItem}>
      <div style={{ ...styles.expenseCatIcon, background: cat.color + "20", color: cat.color }}>
        {cat.icon}
      </div>
      <div style={styles.expenseInfo}>
        <div style={styles.expenseTitle}>{expense.description}</div>
        <div style={styles.expenseMeta}>
          <span style={{ ...styles.expenseCatBadge, background: cat.color + "15", color: cat.color }}>
            {cat.name}
          </span>
          <span style={styles.expenseDate}>
            {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {expense.note && <span style={styles.expenseNote}>📝 {expense.note}</span>}
        </div>
      </div>
      <div style={styles.expenseRight}>
        <div style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</div>
        <button onClick={() => onDelete(expense.id)} style={styles.deleteBtn}>✕</button>
      </div>
    </div>
  );
}

function AddExpenseForm({ onAdd, budgetWarning }) {
  const [form, setForm] = useState({ description: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = "Description required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = "Valid amount required";
    if (!form.date) errs.date = "Date required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, amount: Number(form.amount) });
    setForm({ description: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setErrors({});
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} style={styles.addForm}>
      <h3 style={styles.formTitle}>Add Expense</h3>

      {budgetWarning && (
        <div style={styles.warningBanner}>⚠️ {budgetWarning}</div>
      )}

      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Description *</label>
          <input value={form.description} onChange={set("description")} placeholder="e.g. Lunch at canteen" style={{ ...styles.input, ...(errors.description ? styles.inputError : {}) }} />
          {errors.description && <span style={styles.errorMsg}>{errors.description}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Amount (₹) *</label>
          <input value={form.amount} onChange={set("amount")} type="number" min="0" step="0.01" placeholder="0.00" style={{ ...styles.input, ...(errors.amount ? styles.inputError : {}) }} />
          {errors.amount && <span style={styles.errorMsg}>{errors.amount}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Category</label>
          <select value={form.category} onChange={set("category")} style={styles.select}>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date *</label>
          <input value={form.date} onChange={set("date")} type="date" style={{ ...styles.input, ...(errors.date ? styles.inputError : {}) }} />
          {errors.date && <span style={styles.errorMsg}>{errors.date}</span>}
        </div>

        <div style={{ ...styles.formGroup, gridColumn: "span 2" }}>
          <label style={styles.label}>Note (optional)</label>
          <input value={form.note} onChange={set("note")} placeholder="Any additional details..." style={styles.input} />
        </div>
      </div>

      <button type="submit" style={styles.submitBtn}>+ Add Expense</button>
    </form>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("expenses-v1")) || DEMO_EXPENSES; }
    catch { return DEMO_EXPENSES; }
  });
  const [budget, setBudget] = useState(() => Number(localStorage.getItem("budget")) || 20000);
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("overview"); // overview | list | charts

  useEffect(() => { localStorage.setItem("expenses-v1", JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem("budget", budget); }, [budget]);

  const addExpense = (data) => {
    setExpenses(prev => [{ id: generateId(), ...data, createdAt: Date.now() }, ...prev]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Filter expenses to selected month
  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }), [expenses, selectedMonth, selectedYear]);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget - totalSpent;
  const budgetPercent = Math.min((totalSpent / budget) * 100, 100);
  const budgetWarning = totalSpent > budget * 0.9 ? `You've used ${Math.round(budgetPercent)}% of your budget!` : null;

  // Category breakdown for charts
  const categoryData = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, ...getCategoryInfo(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = (selectedMonth - 5 + i + 12) % 12;
      const y = m > selectedMonth ? selectedYear - 1 : selectedYear;
      const total = expenses
        .filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((sum, e) => sum + e.amount, 0);
      return { month: MONTHS[m], total };
    });
  }, [expenses, selectedMonth, selectedYear]);

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>💰 SpendSmart</h1>
            <p style={styles.subtitle}>Personal expense tracker</p>
          </div>
          <div style={styles.monthSelector}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setSelectedMonth(i)}
                style={{ ...styles.monthBtn, ...(i === selectedMonth ? styles.monthBtnActive : {}) }}>
                {m}
              </button>
            ))}
          </div>
        </header>

        {/* Budget Bar */}
        <div style={styles.budgetSection}>
          <div style={styles.budgetHeader}>
            <span style={styles.budgetLabel}>Monthly Budget</span>
            {editingBudget ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tempBudget} onChange={e => setTempBudget(e.target.value)} type="number" style={styles.budgetInput} />
                <button onClick={() => { setBudget(Number(tempBudget)); setEditingBudget(false); }} style={styles.budgetSaveBtn}>Save</button>
              </div>
            ) : (
              <button onClick={() => { setTempBudget(budget); setEditingBudget(true); }} style={styles.editBudgetBtn}>
                {formatCurrency(budget)} ✏️
              </button>
            )}
          </div>
          <div style={styles.budgetBarBg}>
            <div style={{
              ...styles.budgetBarFill,
              width: `${budgetPercent}%`,
              background: budgetPercent > 90 ? "#ef4444" : budgetPercent > 70 ? "#f59e0b" : "#10b981"
            }} />
          </div>
          <div style={styles.budgetNumbers}>
            <span style={{ color: "#ef4444" }}>Spent: {formatCurrency(totalSpent)}</span>
            <span style={{ color: remaining >= 0 ? "#10b981" : "#ef4444" }}>
              {remaining >= 0 ? "Remaining" : "Over"}: {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <SummaryCard label="Total Spent" value={formatCurrency(totalSpent)} icon="💸" color="#ef4444" sub={`${monthExpenses.length} transactions`} />
          <SummaryCard label="Budget Left" value={formatCurrency(Math.max(remaining, 0))} icon="🎯" color="#10b981" sub={`${Math.round(100 - budgetPercent)}% remaining`} />
          <SummaryCard label="Avg / Day" value={formatCurrency(totalSpent / (new Date().getDate()))} icon="📅" color="#6366f1" sub="This month" />
          <SummaryCard label="Top Category" value={categoryData[0]?.name || "—"} icon={categoryData[0]?.icon || "📊"} color="#f59e0b" sub={categoryData[0] ? formatCurrency(categoryData[0].value) : "No data"} />
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["overview", "list", "charts"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
              {tab === "overview" ? "📊 Overview" : tab === "list" ? "📋 Expenses" : "📈 Charts"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <AddExpenseForm onAdd={addExpense} budgetWarning={budgetWarning} />
        )}

        {activeTab === "list" && (
          <div>
            {monthExpenses.length === 0 ? (
              <div style={styles.emptyState}><span style={{ fontSize: 48 }}>🧾</span><p>No expenses for {MONTHS[selectedMonth]}.</p></div>
            ) : (
              <div style={styles.expenseList}>
                {monthExpenses.map(e => <ExpenseItem key={e.id} expense={e} onDelete={deleteExpense} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "charts" && (
          <div style={styles.chartsSection}>
            {/* Pie Chart */}
            {categoryData.length > 0 && (
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Spending by Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>6-Month Spending Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Table */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Category Breakdown</h3>
              {categoryData.map(cat => (
                <div key={cat.name} style={styles.catRow}>
                  <div style={styles.catRowLeft}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={styles.catName}>{cat.name}</span>
                  </div>
                  <div style={styles.catBarWrap}>
                    <div style={{ ...styles.catBar, width: `${(cat.value / totalSpent) * 100}%`, background: cat.color }} />
                  </div>
                  <span style={{ ...styles.catAmount, color: cat.color }}>{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const DEMO_EXPENSES = [
  { id: "1", description: "Lunch at canteen", amount: 120, category: "Food", date: new Date().toISOString().split("T")[0], note: "", createdAt: Date.now() },
  { id: "2", description: "Auto rickshaw", amount: 80, category: "Transport", date: new Date().toISOString().split("T")[0], note: "", createdAt: Date.now() - 1000 },
  { id: "3", description: "Electricity bill", amount: 1200, category: "Bills", date: new Date().toISOString().split("T")[0], note: "Monthly", createdAt: Date.now() - 2000 },
  { id: "4", description: "Movie tickets", amount: 350, category: "Entertain", date: new Date().toISOString().split("T")[0], note: "", createdAt: Date.now() - 3000 },
  { id: "5", description: "React books", amount: 599, category: "Education", date: new Date().toISOString().split("T")[0], note: "", createdAt: Date.now() - 4000 },
];

const styles = {
  app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 800, margin: "0 auto", padding: "24px 16px" },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#94a3b8", margin: "4px 0 16px" },
  monthSelector: { display: "flex", gap: 4, flexWrap: "wrap" },
  monthBtn: { padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b" },
  monthBtnActive: { background: "#6366f1", color: "#fff", borderColor: "#6366f1", fontWeight: 700 },
  budgetSection: { background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid #e2e8f0" },
  budgetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  budgetLabel: { fontSize: 14, fontWeight: 600, color: "#374151" },
  editBudgetBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#6366f1", fontWeight: 600 },
  budgetInput: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 14, outline: "none", width: 120 },
  budgetSaveBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  budgetBarBg: { background: "#f1f5f9", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 8 },
  budgetBarFill: { height: "100%", borderRadius: 99, transition: "width 0.5s ease, background 0.3s" },
  budgetNumbers: { display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 },
  summaryCard: { background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0" },
  summaryTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  summaryValue: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  summarySub: { fontSize: 11, color: "#94a3b8" },
  tabs: { display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", borderRadius: 12, padding: 4 },
  tab: { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#64748b" },
  tabActive: { background: "#fff", color: "#6366f1", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  addForm: { background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" },
  formTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0f172a" },
  warningBanner: { background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none" },
  inputError: { borderColor: "#ef4444" },
  select: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none" },
  errorMsg: { fontSize: 11, color: "#ef4444" },
  submitBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 15, width: "100%" },
  expenseList: { display: "flex", flexDirection: "column", gap: 8 },
  expenseItem: { background: "#fff", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #f1f5f9" },
  expenseCatIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 },
  expenseMeta: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  expenseCatBadge: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 },
  expenseDate: { fontSize: 12, color: "#94a3b8" },
  expenseNote: { fontSize: 12, color: "#94a3b8" },
  expenseRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 },
  expenseAmount: { fontSize: 16, fontWeight: 700, color: "#ef4444" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94a3b8", padding: 2 },
  emptyState: { textAlign: "center", padding: 48, color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  chartsSection: { display: "flex", flexDirection: "column", gap: 16 },
  chartCard: { background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" },
  chartTitle: { margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" },
  catRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  catRowLeft: { display: "flex", alignItems: "center", gap: 8, width: 120 },
  catName: { fontSize: 13, fontWeight: 500, color: "#374151" },
  catBarWrap: { flex: 1, background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" },
  catBar: { height: "100%", borderRadius: 99, transition: "width 0.5s" },
  catAmount: { fontSize: 13, fontWeight: 700, minWidth: 80, textAlign: "right" },
};
