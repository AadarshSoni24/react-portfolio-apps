// ============================================================
// PROJECT 5: GITHUB USER SEARCH
// Stack: React, GitHub Public API, useReducer, custom hooks
// Concepts: useReducer, custom hooks, debouncing, pagination
//
// HOW TO RUN:
// 1. npx create-react-app github-search
// 2. Replace src/App.js with this file
// 3. npm start
// Note: GitHub API has 60 requests/hour without a token.
//       Add a token in the headers for 5000 requests/hour.
// ============================================================

import { useState, useEffect, useReducer, useCallback, useRef } from "react";

const API = "https://api.github.com";

// Optional: Add your GitHub personal access token for higher rate limits
// Create at: https://github.com/settings/tokens (no scopes needed for public data)
const GITHUB_TOKEN = ""; // "ghp_yourtoken..."

const headers = GITHUB_TOKEN
  ? { Authorization: `token ${GITHUB_TOKEN}` }
  : {};

// ─── Custom Hook: useDebounce ─────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Custom Hook: useFetch ────────────────────────────────────
function useFetch(url) {
  const [state, dispatch] = useReducer(fetchReducer, { data: null, loading: false, error: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    dispatch({ type: "FETCH_START" });

    fetch(url, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => { if (!cancelled) dispatch({ type: "FETCH_SUCCESS", payload: data }); })
      .catch(err => { if (!cancelled) dispatch({ type: "FETCH_ERROR", payload: err.message }); });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}

function fetchReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":   return { data: null, loading: true, error: null };
    case "FETCH_SUCCESS": return { data: action.payload, loading: false, error: null };
    case "FETCH_ERROR":   return { data: null, loading: false, error: action.payload };
    default: return state;
  }
}

// ─── Sub-Components ──────────────────────────────────────────
function StatPill({ icon, value, label }) {
  return (
    <div style={styles.statPill}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={styles.pillValue}>{value?.toLocaleString()}</span>
      <span style={styles.pillLabel}>{label}</span>
    </div>
  );
}

function UserCard({ user, onSelect, isSelected }) {
  return (
    <div
      onClick={() => onSelect(user.login)}
      style={{ ...styles.userCard, ...(isSelected ? styles.userCardSelected : {}) }}
    >
      <img src={user.avatar_url} alt={user.login} style={styles.userAvatar} />
      <div style={styles.userInfo}>
        <div style={styles.userLogin}>@{user.login}</div>
        {user.score && <div style={styles.userScore}>Score: {Math.round(user.score)}</div>}
      </div>
      <span style={styles.userArrow}>›</span>
    </div>
  );
}

function RepoCard({ repo }) {
  const langColors = {
    JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3776ab",
    CSS: "#563d7c", HTML: "#e34c26", Java: "#b07219", default: "#6b7280"
  };

  return (
    <a href={repo.html_url} target="_blank" rel="noreferrer" style={styles.repoCard}>
      <div style={styles.repoTop}>
        <div style={styles.repoName}>📦 {repo.name}</div>
        {repo.fork && <span style={styles.forkBadge}>Fork</span>}
      </div>
      {repo.description && <p style={styles.repoDesc}>{repo.description}</p>}
      <div style={styles.repoMeta}>
        {repo.language && (
          <span style={styles.repoLang}>
            <span style={{ ...styles.langDot, background: langColors[repo.language] || langColors.default }} />
            {repo.language}
          </span>
        )}
        <span style={styles.repoStat}>⭐ {repo.stargazers_count}</span>
        <span style={styles.repoStat}>🍴 {repo.forks_count}</span>
        {repo.updated_at && (
          <span style={styles.repoDate}>
            Updated {new Date(repo.updated_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </a>
  );
}

function ProfilePanel({ username }) {
  const { data: user, loading: userLoading, error: userError } = useFetch(username ? `${API}/users/${username}` : null);
  const { data: repos, loading: reposLoading } = useFetch(username ? `${API}/users/${username}/repos?sort=updated&per_page=12` : null);

  if (userLoading) return <div style={styles.panelLoading}><div style={styles.spinner} /><p>Loading profile...</p></div>;
  if (userError)   return <div style={styles.panelError}><span>⚠️</span><p>{userError}</p></div>;
  if (!user)       return <div style={styles.panelEmpty}><span style={{ fontSize: 64 }}>👤</span><p>Select a user to see their profile</p></div>;

  return (
    <div style={styles.profilePanel}>
      {/* Profile Header */}
      <div style={styles.profileHeader}>
        <img src={user.avatar_url} alt={user.login} style={styles.profileAvatar} />
        <div>
          <h2 style={styles.profileName}>{user.name || user.login}</h2>
          <a href={user.html_url} target="_blank" rel="noreferrer" style={styles.profileLogin}>@{user.login} ↗</a>
          {user.bio && <p style={styles.profileBio}>{user.bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <StatPill icon="📦" value={user.public_repos} label="Repos" />
        <StatPill icon="👥" value={user.followers}    label="Followers" />
        <StatPill icon="👣" value={user.following}    label="Following" />
        <StatPill icon="⭐" value={user.public_gists} label="Gists" />
      </div>

      {/* Meta info */}
      <div style={styles.profileMeta}>
        {user.company  && <span style={styles.metaItem}>🏢 {user.company}</span>}
        {user.location && <span style={styles.metaItem}>📍 {user.location}</span>}
        {user.blog     && <a href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" style={styles.metaItem}>🔗 {user.blog}</a>}
        {user.twitter_username && <span style={styles.metaItem}>🐦 @{user.twitter_username}</span>}
        <span style={styles.metaItem}>📅 Joined {new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
      </div>

      {/* Repos */}
      <div style={styles.reposSection}>
        <h3 style={styles.reposSectionTitle}>
          Recent Repositories {reposLoading && "..."}
        </h3>
        <div style={styles.reposGrid}>
          {repos?.filter(r => !r.fork).slice(0, 6).map(repo => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
        {repos?.length === 0 && <p style={{ color: "#94a3b8", textAlign: "center" }}>No public repositories.</p>}
        <a href={`https://github.com/${username}?tab=repositories`} target="_blank" rel="noreferrer" style={styles.viewAllBtn}>
          View all repositories ↗
        </a>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function GitHubSearch() {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const debouncedQuery = useDebounce(query, 500);

  const searchUrl = debouncedQuery.length >= 2
    ? `${API}/search/users?q=${encodeURIComponent(debouncedQuery)}&per_page=${PER_PAGE}&page=${page}`
    : null;

  const { data: searchData, loading, error } = useFetch(searchUrl);

  const users = searchData?.items || [];
  const totalCount = searchData?.total_count || 0;
  const totalPages = Math.min(Math.ceil(totalCount / PER_PAGE), 10); // GitHub caps at 100 results

  // Reset page when query changes
  useEffect(() => { setPage(1); }, [debouncedQuery]);

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoRow}>
            <span style={styles.logoIcon}>🐙</span>
            <div>
              <h1 style={styles.appTitle}>GitHub Explorer</h1>
              <p style={styles.appSubtitle}>Search any GitHub user profile</p>
            </div>
          </div>
          <div style={styles.searchBar}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search GitHub users... (e.g. torvalds)"
              style={styles.searchInput}
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelectedUser(""); }} style={styles.clearBtn}>✕</button>
            )}
          </div>
          {debouncedQuery && !loading && (
            <p style={styles.resultCount}>
              {totalCount > 0 ? `${totalCount.toLocaleString()} users found` : "No users found"}
            </p>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Left: Search Results */}
        <div style={styles.leftPane}>
          {loading && (
            <div style={styles.centeredPane}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Searching...</p>
            </div>
          )}
          {error && !loading && (
            <div style={styles.errorBox}><span>⚠️</span><p>{error}</p></div>
          )}
          {!loading && !error && !debouncedQuery && (
            <div style={styles.welcomeState}>
              <span style={{ fontSize: 48 }}>🔭</span>
              <p>Search a GitHub username to explore their profile and repositories.</p>
              <div style={styles.suggestions}>
                <p style={styles.suggestTitle}>Try searching:</p>
                {["torvalds", "gaearon", "sindresorhus", "developit"].map(u => (
                  <button key={u} onClick={() => { setQuery(u); setSelectedUser(u); }} style={styles.suggestionBtn}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && users.length > 0 && (
            <>
              <div style={styles.userList}>
                {users.map(u => (
                  <UserCard key={u.id} user={u} onSelect={setSelectedUser} isSelected={selectedUser === u.login} />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={styles.pageBtn}>‹ Prev</button>
                  <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={styles.pageBtn}>Next ›</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Profile Panel */}
        <div style={styles.rightPane}>
          <ProfilePanel username={selectedUser} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#0d1117", fontFamily: "'Segoe UI', sans-serif", color: "#e6edf3" },
  header: { background: "#161b22", borderBottom: "1px solid #30363d", padding: "16px 20px" },
  headerInner: { maxWidth: 1200, margin: "0 auto" },
  logoRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  logoIcon: { fontSize: 32 },
  appTitle: { fontSize: 22, fontWeight: 800, color: "#e6edf3", margin: 0 },
  appSubtitle: { fontSize: 13, color: "#8b949e", margin: 0 },
  searchBar: { display: "flex", alignItems: "center", background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "0 12px", gap: 10, maxWidth: 600 },
  searchIcon: { fontSize: 16, color: "#8b949e" },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#e6edf3", fontSize: 16, padding: "12px 0" },
  clearBtn: { background: "none", border: "none", color: "#8b949e", cursor: "pointer", fontSize: 16 },
  resultCount: { fontSize: 13, color: "#8b949e", margin: "8px 0 0" },
  mainLayout: { display: "grid", gridTemplateColumns: "300px 1fr", maxWidth: 1200, margin: "0 auto", minHeight: "calc(100vh - 140px)" },
  leftPane: { borderRight: "1px solid #30363d", overflowY: "auto", maxHeight: "calc(100vh - 140px)" },
  rightPane: { overflowY: "auto", maxHeight: "calc(100vh - 140px)" },
  userList: { padding: 8 },
  userCard: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1px solid transparent", marginBottom: 2, transition: "all 0.15s" },
  userCardSelected: { background: "#1f6feb20", border: "1px solid #1f6feb" },
  userAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover" },
  userInfo: { flex: 1 },
  userLogin: { fontSize: 14, fontWeight: 600, color: "#e6edf3" },
  userScore: { fontSize: 11, color: "#8b949e" },
  userArrow: { color: "#8b949e", fontSize: 18 },
  centeredPane: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 12 },
  spinner: { width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #1f6feb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { color: "#8b949e", fontSize: 14 },
  errorBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32, color: "#f87171", textAlign: "center" },
  welcomeState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 32, color: "#8b949e", textAlign: "center" },
  suggestions: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  suggestTitle: { fontSize: 12, margin: 0 },
  suggestionBtn: { background: "#21262d", border: "1px solid #30363d", borderRadius: 8, padding: "6px 14px", color: "#1f6feb", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px 8px", borderTop: "1px solid #30363d" },
  pageBtn: { background: "#21262d", border: "1px solid #30363d", borderRadius: 8, padding: "6px 12px", color: "#e6edf3", cursor: "pointer", fontSize: 13 },
  pageInfo: { fontSize: 13, color: "#8b949e" },
  panelLoading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 12, color: "#8b949e" },
  panelError: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32, color: "#f87171" },
  panelEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#8b949e", textAlign: "center", padding: 32 },
  profilePanel: { padding: 24 },
  profileHeader: { display: "flex", gap: 16, marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: "50%", border: "2px solid #30363d" },
  profileName: { fontSize: 22, fontWeight: 700, color: "#e6edf3", margin: "0 0 4px" },
  profileLogin: { fontSize: 14, color: "#1f6feb", textDecoration: "none", display: "block", marginBottom: 8 },
  profileBio: { fontSize: 14, color: "#8b949e", margin: 0, lineHeight: 1.5 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 },
  statPill: { background: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  pillValue: { fontSize: 18, fontWeight: 700, color: "#e6edf3" },
  pillLabel: { fontSize: 11, color: "#8b949e" },
  profileMeta: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #30363d" },
  metaItem: { fontSize: 13, color: "#8b949e", textDecoration: "none" },
  reposSection: {},
  reposSectionTitle: { fontSize: 16, fontWeight: 700, color: "#e6edf3", margin: "0 0 16px" },
  reposGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
  repoCard: { background: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: 14, textDecoration: "none", display: "block", transition: "border-color 0.2s" },
  repoTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  repoName: { fontSize: 14, fontWeight: 700, color: "#1f6feb" },
  forkBadge: { fontSize: 10, color: "#8b949e", border: "1px solid #30363d", borderRadius: 99, padding: "2px 6px" },
  repoDesc: { fontSize: 12, color: "#8b949e", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  repoMeta: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  repoLang: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8b949e" },
  langDot: { width: 10, height: 10, borderRadius: "50%" },
  repoStat: { fontSize: 12, color: "#8b949e" },
  repoDate: { fontSize: 11, color: "#6e7681", marginLeft: "auto" },
  viewAllBtn: { display: "inline-block", marginTop: 16, color: "#1f6feb", fontSize: 13, textDecoration: "none", fontWeight: 600 },
};
