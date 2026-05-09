// ============================================================
// WEATHER APP — WeatherAPI.com
// Stack: React, WeatherAPI.com (https://www.weatherapi.com)
//
// HOW TO RUN:
// 1. Go to https://www.weatherapi.com → Sign up (FREE)
// 2. Copy your API key from dashboard
// 3. npx create-react-app weather-app
// 4. Replace src/App.js with this file
// 5. Replace YOUR_API_KEY below with your actual key
// 6. npm start
//
// FREE TIER GIVES YOU:
// - Current weather
// - 3-day forecast
// - Astronomy (sunrise/sunset)
// - Air quality
// - 1 million calls/month FREE
// ============================================================

import { useState, useEffect, useCallback } from "react";

// ─── REPLACE THIS WITH YOUR KEY FROM weatherapi.com ───────────
const API_KEY = "516d86988bc4431e827211819260405";
const BASE    = "https://api.weatherapi.com/v1";

// ─── Helpers ──────────────────────────────────────────────────
const getAQILabel = (aqi) => {
  if (!aqi) return { label: "N/A", color: "#94a3b8" };
  if (aqi === 1) return { label: "Good",        color: "#22c55e" };
  if (aqi === 2) return { label: "Moderate",    color: "#eab308" };
  if (aqi === 3) return { label: "Unhealthy*",  color: "#f97316" };
  if (aqi === 4) return { label: "Unhealthy",   color: "#ef4444" };
  if (aqi === 5) return { label: "Very Bad",    color: "#a855f7" };
  return              { label: "Hazardous",    color: "#7f1d1d" };
};

const getUVLabel = (uv) => {
  if (uv <= 2)  return { label: "Low",       color: "#22c55e" };
  if (uv <= 5)  return { label: "Moderate",  color: "#eab308" };
  if (uv <= 7)  return { label: "High",      color: "#f97316" };
  if (uv <= 10) return { label: "Very High", color: "#ef4444" };
  return              { label: "Extreme",    color: "#7c3aed" };
};

const windDir = (deg) => {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
};

const formatTime = (t) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

// Background gradient based on weather condition code
const getBg = (code, isDay) => {
  if (!isDay) return "linear-gradient(160deg, #0f0c29 0%, #1a1a4e 50%, #24243e 100%)";
  if ([1000].includes(code))                          return "linear-gradient(160deg, #0EA5E9 0%, #38BDF8 50%, #7DD3FC 100%)";
  if ([1003,1006,1009].includes(code))               return "linear-gradient(160deg, #475569 0%, #64748b 50%, #94a3b8 100%)";
  if ([1030,1135,1147].includes(code))               return "linear-gradient(160deg, #78716c 0%, #a8a29e 50%, #d6d3d1 100%)";
  if (code >= 1180 && code <= 1201)                  return "linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)";
  if (code >= 1210 && code <= 1282)                  return "linear-gradient(160deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)";
  if ([1087,1273,1276,1279,1282].includes(code))     return "linear-gradient(160deg, #1f2937 0%, #374151 50%, #4b5563 100%)";
  return "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)";
};

// ─── Sub Components ───────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `2px solid ${accent || "rgba(255,255,255,0.2)"}` }}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statVal}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
      {sub && <span style={styles.statSub}>{sub}</span>}
    </div>
  );
}

function HourCard({ hour }) {
  const time = formatTime(hour.time.split(" ")[1]);
  const isNow = new Date().getHours() === new Date(hour.time).getHours();
  return (
    <div style={{ ...styles.hourCard, ...(isNow ? styles.hourCardActive : {}) }}>
      <span style={styles.hourTime}>{isNow ? "Now" : time}</span>
      <img src={`https:${hour.condition.icon}`} alt={hour.condition.text} style={styles.hourIcon} />
      <span style={styles.hourTemp}>{Math.round(hour.temp_c)}°</span>
      <span style={styles.hourWind}>💨 {Math.round(hour.wind_kph)}</span>
      <span style={styles.hourRain}>🌧 {hour.chance_of_rain}%</span>
    </div>
  );
}

function DayCard({ day, date, isToday }) {
  const d = new Date(date);
  const dayName = isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" });
  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div style={{ ...styles.dayCard, ...(isToday ? styles.dayCardToday : {}) }}>
      <div style={styles.dayLeft}>
        <span style={styles.dayName}>{dayName}</span>
        <span style={styles.dayDate}>{dateStr}</span>
      </div>
      <img src={`https:${day.condition.icon}`} alt={day.condition.text} style={styles.dayIcon} />
      <span style={styles.dayDesc}>{day.condition.text}</span>
      <div style={styles.dayTemps}>
        <span style={styles.dayHigh}>↑{Math.round(day.maxtemp_c)}°</span>
        <span style={styles.dayLow}>↓{Math.round(day.mintemp_c)}°</span>
      </div>
      <span style={styles.dayRain}>🌧 {day.daily_chance_of_rain}%</span>
    </div>
  );
}

function SearchBar({ value, onChange, onSearch, loading }) {
  const handleKey = (e) => { if (e.key === "Enter") onSearch(); };
  return (
    <div style={styles.searchWrap}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search city, landmark, or coordinates..."
        style={styles.searchInput}
      />
      <button onClick={onSearch} disabled={loading} style={styles.searchBtn}>
        {loading ? <span style={styles.btnSpinner} /> : "Search"}
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function WeatherApp() {
  const [query,   setQuery]   = useState("Raipur");
  const [input,   setInput]   = useState("");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [unit,    setUnit]    = useState("C"); // C or F
  const [activeTab, setTab]   = useState("today"); // today | tomorrow | day3
  const [showSearch, setShowSearch] = useState(false);

  const temp = (c) => unit === "C" ? `${Math.round(c)}°C` : `${Math.round(c * 9/5 + 32)}°F`;
  const tempNum = (c) => unit === "C" ? Math.round(c) : Math.round(c * 9/5 + 32);

  const fetchWeather = useCallback(async (city) => {
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // WeatherAPI supports current + forecast + astronomy + air_quality in ONE call
      const res = await fetch(
        `${BASE}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=yes&alerts=yes`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "City not found");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(query); }, [query, fetchWeather]);

  const handleSearch = () => {
    if (input.trim()) {
      setQuery(input.trim());
      setInput("");
      setShowSearch(false);
    }
  };

  // Quick city buttons
  const quickCities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Raipur"];

  const bg = data ? getBg(data.current.condition.code, data.current.is_day) : "linear-gradient(160deg, #0f172a, #1e293b)";
  const current = data?.current;
  const location = data?.location;
  const forecast = data?.forecast?.forecastday;
  const todayForecast = forecast?.[0];
  const aqi = getAQILabel(current?.air_quality?.["us-epa-index"]);
  const uv = getUVLabel(current?.uv);

  // Tab selector
  const tabDays = { today: 0, tomorrow: 1, day3: 2 };
  const activeForecast = forecast?.[tabDays[activeTab]];

  return (
    <div style={{ ...styles.app, background: bg }}>
      {/* Animated background circles */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.container}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.appIcon}>🌍</span>
            <div>
              <div style={styles.appName}>SkyWatch</div>
              <div style={styles.appSub}>Powered by WeatherAPI</div>
            </div>
          </div>
          <div style={styles.headerRight}>
            {/* Unit toggle */}
            <button
              onClick={() => setUnit(u => u === "C" ? "F" : "C")}
              style={styles.unitBtn}
            >
              °{unit === "C" ? "F" : "C"}
            </button>
            {/* Search toggle */}
            <button onClick={() => setShowSearch(s => !s)} style={styles.searchToggleBtn}>
              {showSearch ? "✕" : "🔍"}
            </button>
          </div>
        </header>

        {/* ── Search Panel ── */}
        {showSearch && (
          <div style={styles.searchPanel}>
            <SearchBar value={input} onChange={setInput} onSearch={handleSearch} loading={loading} />
            <div style={styles.quickCities}>
              {quickCities.map(c => (
                <button key={c} onClick={() => { setQuery(c); setShowSearch(false); }} style={styles.quickBtn}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && !data && (
          <div style={styles.centered}>
            <div style={styles.loadingRing} />
            <p style={styles.loadingText}>Fetching weather data...</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={styles.errorCard}>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <h3 style={{ margin: "8px 0 4px", color: "#fff" }}>Oops!</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>{error}</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>
              Check your API key at weatherapi.com or try a different city name.
            </p>
          </div>
        )}

        {/* ── Main Weather Data ── */}
        {data && !error && (
          <>
            {/* Location + DateTime */}
            <div style={styles.locationBlock}>
              <h1 style={styles.locationName}>
                📍 {location.name}
                <span style={styles.locationCountry}>, {location.region}, {location.country}</span>
              </h1>
              <div style={styles.locationMeta}>
                <span>{new Date(location.localtime).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                <span style={styles.dot}>·</span>
                <span>{formatTime(location.localtime.split(" ")[1])}</span>
                <span style={styles.dot}>·</span>
                <span>{current.is_day ? "☀️ Day" : "🌙 Night"}</span>
              </div>
            </div>

            {/* ── Hero Temperature ── */}
            <div style={styles.heroBlock}>
              <div style={styles.heroLeft}>
                <div style={styles.heroTemp}>{tempNum(current.temp_c)}°</div>
                <div style={styles.heroUnit}>{unit}</div>
                <div style={styles.heroFeels}>Feels like {temp(current.feelslike_c)}</div>
                <div style={styles.heroCondition}>
                  <img src={`https:${current.condition.icon}`} alt="" style={{ width: 32, height: 32 }} />
                  {current.condition.text}
                </div>
              </div>
              <div style={styles.heroRight}>
                <div style={styles.heroMinMax}>
                  <span style={styles.heroMax}>↑ {temp(todayForecast?.day.maxtemp_c)}</span>
                  <span style={styles.heroMin}>↓ {temp(todayForecast?.day.mintemp_c)}</span>
                </div>
                {/* AQI Badge */}
                <div style={{ ...styles.aqiBadge, background: aqi.color + "30", borderColor: aqi.color }}>
                  <span style={{ color: aqi.color, fontWeight: 700 }}>AQI: {aqi.label}</span>
                </div>
                {/* UV Badge */}
                <div style={{ ...styles.aqiBadge, background: uv.color + "30", borderColor: uv.color }}>
                  <span style={{ color: uv.color, fontWeight: 700 }}>UV: {current.uv} — {uv.label}</span>
                </div>
              </div>
            </div>

            {/* ── Stats Grid ── */}
            <div style={styles.statsGrid}>
              <StatCard icon="💧" label="Humidity"    value={`${current.humidity}%`}                          accent="#38bdf8" />
              <StatCard icon="💨" label="Wind"        value={`${Math.round(current.wind_kph)} km/h`}          sub={windDir(current.wind_degree)} accent="#a78bfa" />
              <StatCard icon="🌡️" label="Pressure"    value={`${current.pressure_mb} mb`}                    accent="#fb923c" />
              <StatCard icon="👁️" label="Visibility"  value={`${current.vis_km} km`}                         accent="#34d399" />
              <StatCard icon="☁️" label="Cloud Cover" value={`${current.cloud}%`}                             accent="#94a3b8" />
              <StatCard icon="🌿" label="Dew Point"   value={`${temp(current.dewpoint_c)}`}                   accent="#6ee7b7" />
              <StatCard icon="🌅" label="Sunrise"     value={todayForecast?.astro.sunrise?.replace(" AM","") + " AM"} accent="#fbbf24" />
              <StatCard icon="🌇" label="Sunset"      value={todayForecast?.astro.sunset?.replace(" PM","") + " PM"}  accent="#f97316" />
              <StatCard icon="🌙" label="Moonrise"    value={todayForecast?.astro.moonrise}                   accent="#818cf8" />
              <StatCard icon="💫" label="Moon Phase"  value={todayForecast?.astro.moon_phase}                 accent="#c084fc" />
              <StatCard icon="🌧️" label="Rain Chance" value={`${todayForecast?.day.daily_chance_of_rain}%`}  accent="#38bdf8" />
              <StatCard icon="❄️" label="Snow Chance" value={`${todayForecast?.day.daily_chance_of_snow}%`}  accent="#bfdbfe" />
            </div>

            {/* ── Alerts ── */}
            {data.alerts?.alert?.length > 0 && (
              <div style={styles.alertBox}>
                <h3 style={styles.alertTitle}>⚠️ Weather Alert</h3>
                {data.alerts.alert.map((a, i) => (
                  <div key={i} style={styles.alertItem}>
                    <strong>{a.headline}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.8 }}>{a.desc?.slice(0, 200)}...</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Hourly Forecast (tabs) ── */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Hourly Forecast</h3>
              <div style={styles.tabs}>
                {[["today","Today"],["tomorrow","Tomorrow"],["day3","Day 3"]].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.hourlyScroll}>
              {activeForecast?.hour.map((h, i) => <HourCard key={i} hour={h} />)}
            </div>

            {/* ── 3-Day Forecast ── */}
            <h3 style={styles.sectionTitle}>3-Day Forecast</h3>
            <div style={styles.daysGrid}>
              {forecast?.map((f, i) => (
                <DayCard key={f.date} day={f.day} date={f.date} isToday={i === 0} />
              ))}
            </div>

            {/* ── Air Quality Detail ── */}
            {current.air_quality && (
              <>
                <h3 style={styles.sectionTitle}>Air Quality Index</h3>
                <div style={styles.aqiGrid}>
                  {[
                    { label: "CO",    value: current.air_quality.co?.toFixed(1),    unit: "μg/m³" },
                    { label: "NO₂",   value: current.air_quality.no2?.toFixed(1),   unit: "μg/m³" },
                    { label: "O₃",    value: current.air_quality.o3?.toFixed(1),    unit: "μg/m³" },
                    { label: "SO₂",   value: current.air_quality.so2?.toFixed(1),   unit: "μg/m³" },
                    { label: "PM2.5", value: current.air_quality.pm2_5?.toFixed(1), unit: "μg/m³" },
                    { label: "PM10",  value: current.air_quality.pm10?.toFixed(1),  unit: "μg/m³" },
                  ].map(item => (
                    <div key={item.label} style={styles.aqiItem}>
                      <span style={styles.aqiLabel}>{item.label}</span>
                      <span style={styles.aqiVal}>{item.value ?? "N/A"}</span>
                      <span style={styles.aqiUnit}>{item.unit}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Data credit */}
            <p style={styles.credit}>
              Data from <a href="https://www.weatherapi.com" target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.5)" }}>WeatherAPI.com</a>
              {" · "}Last updated: {current.last_updated}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  app: {
    minHeight: "100vh",
    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "fixed", top: -200, right: -200,
    width: 600, height: 600, borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "fixed", bottom: -300, left: -150,
    width: 700, height: 700, borderRadius: "50%",
    background: "rgba(255,255,255,0.02)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "20px 16px 60px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  appIcon: { fontSize: 28 },
  appName: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  appSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  headerRight: { display: "flex", gap: 8 },
  unitBtn: {
    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, color: "#fff", padding: "7px 14px", cursor: "pointer",
    fontSize: 14, fontWeight: 700, backdropFilter: "blur(8px)",
  },
  searchToggleBtn: {
    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, color: "#fff", padding: "7px 14px", cursor: "pointer",
    fontSize: 16, backdropFilter: "blur(8px)",
  },
  searchPanel: {
    background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
    padding: 16, marginBottom: 20,
  },
  searchWrap: { display: "flex", gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, padding: "11px 16px", color: "#fff", fontSize: 15, outline: "none",
  },
  searchBtn: {
    background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff",
    padding: "11px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14,
    display: "flex", alignItems: "center", gap: 6,
  },
  btnSpinner: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  quickCities: { display: "flex", gap: 6, flexWrap: "wrap" },
  quickBtn: {
    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, color: "rgba(255,255,255,0.8)", padding: "5px 12px",
    cursor: "pointer", fontSize: 13,
  },
  centered: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 20px", gap: 16,
  },
  loadingRing: {
    width: 52, height: 52,
    border: "4px solid rgba(255,255,255,0.15)",
    borderTop: "4px solid #38bdf8",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 16, margin: 0 },
  errorCard: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 16, padding: "32px 24px", textAlign: "center", marginTop: 40,
  },
  locationBlock: { marginBottom: 20 },
  locationName: { fontSize: 26, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 },
  locationCountry: { fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.7)" },
  locationMeta: {
    display: "flex", gap: 8, alignItems: "center",
    color: "rgba(255,255,255,0.6)", fontSize: 13, flexWrap: "wrap",
  },
  dot: { opacity: 0.3 },
  heroBlock: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)",
    borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)",
    padding: "28px 32px", marginBottom: 16,
  },
  heroLeft: { display: "flex", flexDirection: "column", gap: 6 },
  heroTemp: { fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: -4 },
  heroUnit: { fontSize: 22, color: "rgba(255,255,255,0.5)", marginTop: -8 },
  heroFeels: { fontSize: 15, color: "rgba(255,255,255,0.65)" },
  heroCondition: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 16, color: "rgba(255,255,255,0.85)", marginTop: 4,
  },
  heroRight: { display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" },
  heroMinMax: { display: "flex", gap: 12, fontSize: 20, fontWeight: 700 },
  heroMax: { color: "#fbbf24" },
  heroMin: { color: "#93c5fd" },
  aqiBadge: {
    border: "1px solid", borderRadius: 10, padding: "6px 12px", fontSize: 13,
    backdropFilter: "blur(8px)",
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16,
  },
  statCard: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
    padding: "14px 12px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 3,
  },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statVal: { fontSize: 17, fontWeight: 700 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  statSub: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  alertBox: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  alertTitle: { margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "#fca5a5" },
  alertItem: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  sectionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 700, margin: "0 0 10px",
    color: "rgba(255,255,255,0.8)", letterSpacing: 0.5, textTransform: "uppercase",
  },
  tabs: { display: "flex", gap: 4 },
  tab: {
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "rgba(255,255,255,0.6)", padding: "5px 12px",
    cursor: "pointer", fontSize: 12, fontWeight: 500,
  },
  tabActive: {
    background: "rgba(59,130,246,0.4)", border: "1px solid rgba(59,130,246,0.6)",
    color: "#fff", fontWeight: 700,
  },
  hourlyScroll: {
    display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, marginBottom: 20,
    scrollbarWidth: "none",
  },
  hourCard: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
    padding: "14px 10px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 5, minWidth: 80, flexShrink: 0,
  },
  hourCardActive: {
    background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.5)",
  },
  hourTime: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 },
  hourIcon: { width: 34, height: 34 },
  hourTemp: { fontSize: 17, fontWeight: 700 },
  hourWind: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  hourRain: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  daysGrid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
  dayCard: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
    padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
  },
  dayCardToday: {
    background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)",
  },
  dayLeft: { display: "flex", flexDirection: "column", minWidth: 80 },
  dayName: { fontSize: 15, fontWeight: 700 },
  dayDate: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  dayIcon: { width: 40, height: 40 },
  dayDesc: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)" },
  dayTemps: { display: "flex", gap: 12 },
  dayHigh: { fontSize: 16, fontWeight: 700, color: "#fbbf24" },
  dayLow: { fontSize: 16, fontWeight: 600, color: "#93c5fd" },
  dayRain: { fontSize: 13, color: "rgba(255,255,255,0.5)", minWidth: 48, textAlign: "right" },
  aqiGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20,
  },
  aqiItem: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "14px 12px", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 4,
  },
  aqiLabel: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 },
  aqiVal: { fontSize: 20, fontWeight: 800 },
  aqiUnit: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  credit: {
    textAlign: "center", fontSize: 12,
    color: "rgba(255,255,255,0.3)", marginTop: 32,
  },
};