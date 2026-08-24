import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  Dumbbell,
  TrendingUp,
  Scale,
  Plus,
  X,
  Trash2,
  Flame,
  Award,
  Check,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";

// ---------- default data ----------

const DEFAULT_EXERCISES = [
  { id: "ex1", name: "Squat", category: "Legs" },
  { id: "ex2", name: "Deadlift", category: "Legs" },
  { id: "ex3", name: "Bench Press", category: "Chest" },
  { id: "ex4", name: "Incline Bench Press", category: "Chest" },
  { id: "ex5", name: "Bent-Over Row", category: "Back" },
  { id: "ex6", name: "Lat Pulldown", category: "Back" },
  { id: "ex7", name: "Overhead Press", category: "Shoulders" },
  { id: "ex8", name: "Lateral Raise", category: "Shoulders" },
  { id: "ex9", name: "Bicep Curl", category: "Arms" },
  { id: "ex10", name: "Tricep Extension", category: "Arms" },
];

const CATEGORIES = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"];

const CATEGORY_COLOR = {
  Legs: "var(--stamp)",
  Chest: "var(--cobalt)",
  Back: "var(--brass)",
  Shoulders: "var(--stamp)",
  Arms: "var(--cobalt)",
  Core: "var(--brass)",
};

// ---------- utilities ----------

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function bestMapFrom(sessions) {
  const map = {};
  for (const s of sessions) {
    for (const e of s.entries) {
      for (const st of e.sets) {
        const w = Number(st.weight);
        if (w > (map[e.exerciseId] || 0)) map[e.exerciseId] = w;
      }
    }
  }
  return map;
}

// ---------- supabase helpers ----------
// Cada utilizador só recebe (via RLS) as suas próprias linhas, por isso não é
// preciso filtrar por user_id manualmente nestas queries de leitura.

function rowToSession(row) {
  return { id: row.id, date: row.date, entries: row.entries || [] };
}

function rowToBodyweight(row) {
  return { id: row.id, date: row.date, weight: Number(row.weight) };
}

async function fetchExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Failed to load exercises", error);
    return DEFAULT_EXERCISES;
  }
  const custom = (data || []).map((r) => ({ id: r.id, name: r.name, category: r.category }));
  return [...DEFAULT_EXERCISES, ...custom];
}

async function fetchSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.error("Failed to load sessions", error);
    return [];
  }
  return (data || []).map(rowToSession);
}

async function fetchBodyweight() {
  const { data, error } = await supabase
    .from("bodyweight")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.error("Failed to load bodyweight", error);
    return [];
  }
  return (data || []).map(rowToBodyweight);
}

// ---------- global styles ----------

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

      .carga-root {
        --ink: #1c1b19;
        --ink-soft: #26241e;
        --ink-card: #2c2a24;
        --paper: #f2eee3;
        --paper-dim: #c9c2ac;
        --stamp: #c1442d;
        --brass: #a68a4a;
        --cobalt: #5b7fb5;
        font-family: 'Inter', sans-serif;
        background: var(--ink);
        color: var(--paper);
        min-height: 100vh;
        position: relative;
        background-image:
          repeating-linear-gradient(135deg, rgba(242,238,227,0.025) 0px, rgba(242,238,227,0.025) 1px, transparent 1px, transparent 14px);
      }
      .font-display { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

      .stamp-badge {
        width: 84px;
        height: 84px;
        border-radius: 9999px;
        border: 3px solid var(--stamp);
        box-shadow: inset 0 0 0 3px rgba(193,68,45,0.15), 0 0 0 1px rgba(193,68,45,0.25);
        color: var(--stamp);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: rotate(-9deg);
        text-align: center;
        line-height: 1.05;
        flex-shrink: 0;
        animation: stamp-slam 0.45s cubic-bezier(.2,1.6,.4,1);
      }
      @keyframes stamp-slam {
        0% { transform: rotate(-9deg) scale(2.2); opacity: 0; }
        60% { opacity: 1; }
        100% { transform: rotate(-9deg) scale(1); opacity: 1; }
      }

      .card {
        background: var(--ink-card);
        border: 1px solid rgba(242,238,227,0.08);
        border-radius: 10px;
      }

      input[type="text"], input[type="number"], input[type="date"], input[type="password"], input[type="email"], select {
        background: var(--ink);
        border: 1px solid rgba(242,238,227,0.18);
        color: var(--paper);
        border-radius: 6px;
        padding: 8px 10px;
        font-family: 'IBM Plex Mono', monospace;
        outline: none;
      }
      input[type="text"], input[type="email"] { font-family: 'Inter', sans-serif; }
      select { font-family: 'Inter', sans-serif; }
      input:focus, select:focus {
        border-color: var(--stamp);
        box-shadow: 0 0 0 2px rgba(193,68,45,0.25);
      }
      input::placeholder { color: rgba(242,238,227,0.35); }

      .btn-primary {
        background: var(--stamp);
        color: var(--paper);
        font-weight: 700;
        border-radius: 6px;
        transition: transform 0.1s ease, background 0.15s ease;
      }
      .btn-primary:hover { background: #a83a26; }
      .btn-primary:active { transform: scale(0.97); }
      .btn-primary:disabled { opacity: 0.6; }

      .nav-item {
        transition: color 0.15s ease, opacity 0.15s ease;
      }
      .nav-item[data-active="true"] { color: var(--stamp); }
      .nav-item[data-active="false"] { color: var(--paper-dim); }

      @media (prefers-reduced-motion: reduce) {
        .stamp-badge { animation: none; }
      }
    `}</style>
  );
}

// ---------- small components ----------

function StatCard({ label, value, unit, icon: Icon }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide" style={{ color: "var(--paper-dim)" }}>
          {label}
        </span>
        {Icon && <Icon size={16} style={{ color: "var(--brass)" }} />}
      </div>
      <div className="font-mono text-2xl font-semibold">
        {value}
        {unit && <span className="text-sm ml-1" style={{ color: "var(--paper-dim)" }}>{unit}</span>}
      </div>
    </div>
  );
}

function CategoryTag({ category }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-mono"
      style={{
        border: `1px solid ${CATEGORY_COLOR[category] || "var(--brass)"}`,
        color: CATEGORY_COLOR[category] || "var(--brass)",
      }}
    >
      {category}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div
      className="card p-8 text-center text-sm"
      style={{ color: "var(--paper-dim)", borderStyle: "dashed" }}
    >
      {text}
    </div>
  );
}

// ---------- auth ----------

function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: cleanEmail, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      // Se a confirmação de email estiver desativada no Supabase, isto já faz login.
      setInfo("Account created. If you're not logged in automatically, log in below.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      setLoading(false);
      if (error) setError(error.message);
    }
  }

  return (
    <div className="carga-root">
      <GlobalStyle />
      <div className="max-w-sm mx-auto px-4 pt-20 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <img src="/DirtyBulk.jpg" alt="Dirty Bulk Logo" className="w-16 h-16 rounded-xl" />
          <h1 className="font-display text-4xl" style={{ color: "var(--paper)" }}>DIRTY BULK</h1>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--paper-dim)" }}>
            your training log
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-3">
          <h2 className="font-display text-lg" style={{ color: "var(--paper)" }}>
            {mode === "signup" ? "CREATE ACCOUNT" : "LOG IN"}
          </h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono uppercase" style={{ color: "var(--paper-dim)" }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono uppercase" style={{ color: "var(--paper-dim)" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--stamp)" }}>{error}</p>}
          {info && <p className="text-sm" style={{ color: "var(--brass)" }}>{info}</p>}

          <button type="submit" disabled={loading} className="btn-primary py-3 text-sm mt-1">
            {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
              setInfo("");
            }}
            className="text-xs font-mono underline text-center"
            style={{ color: "var(--paper-dim)" }}
          >
            {mode === "signup" ? "Already have an account? Log in" : "No account yet? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------- app (root: decides between auth screen and the app itself) ----------

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = a carregar, null = sem sessão

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="carga-root flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <GlobalStyle />
        <p className="font-mono text-sm" style={{ color: "var(--paper-dim)" }}>Loading…</p>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <AppShell key={session.user.id} userId={session.user.id} />;
}

// ---------- app shell (authenticated app) ----------

function AppShell({ userId }) {
  const [loaded, setLoaded] = useState(false);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [sessions, setSessions] = useState([]);
  const [bodyweight, setBodyweight] = useState([]);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    let active = true;
    (async () => {
      const [ex, sess, bw] = await Promise.all([
        fetchExercises(),
        fetchSessions(),
        fetchBodyweight(),
      ]);
      if (!active) return;
      setExercises(ex);
      setSessions(sess);
      setBodyweight(bw);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // ----- stats -----

  const totalWorkouts = sessions.length;

  const weeklyCount = useMemo(() => {
    const monday = getMonday(new Date());
    return sessions.filter((s) => new Date(s.date + "T00:00:00") >= monday).length;
  }, [sessions]);

  const totalVolume = useMemo(() => {
    let vol = 0;
    for (const s of sessions) {
      for (const e of s.entries) {
        for (const st of e.sets) {
          vol += (Number(st.weight) || 0) * (Number(st.reps) || 0);
        }
      }
    }
    return Math.round(vol);
  }, [sessions]);

  const currentBodyweight = useMemo(() => {
    if (bodyweight.length === 0) return null;
    const sorted = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].weight;
  }, [bodyweight]);

  const prEvents = useMemo(() => {
    const best = {};
    const events = [];
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    for (const s of sorted) {
      for (const e of s.entries) {
        const maxSet = e.sets.reduce(
          (m, st) => (Number(st.weight) > Number(m.weight) ? st : m),
          e.sets[0]
        );
        if (!maxSet) continue;
        const w = Number(maxSet.weight);
        if (w > (best[e.exerciseId] || 0)) {
          best[e.exerciseId] = w;
          const ex = exercises.find((x) => x.id === e.exerciseId);
          events.push({
            id: s.id + e.exerciseId,
            date: s.date,
            exerciseName: ex ? ex.name : "Exercise",
            weight: w,
            reps: maxSet.reps,
          });
        }
      }
    }
    return events.reverse();
  }, [sessions, exercises]);

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [sessions]
  );

  async function handleDeleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) console.error("Failed to delete session", error);
  }

  async function handleDeleteBodyweight(id) {
    setBodyweight((prev) => prev.filter((b) => b.id !== id));
    const { error } = await supabase.from("bodyweight").delete().eq("id", id);
    if (error) console.error("Failed to delete bodyweight entry", error);
  }

  async function handleAddExercise(name, category) {
    const trimmed = name.trim();
    const { data, error } = await supabase
      .from("exercises")
      .insert({ user_id: userId, name: trimmed, category })
      .select()
      .single();
    if (error) {
      console.error("Failed to add exercise", error);
      const fallback = { id: uid(), name: trimmed, category };
      setExercises((prev) => [...prev, fallback]);
      return fallback;
    }
    const ex = { id: data.id, name: data.name, category: data.category };
    setExercises((prev) => [...prev, ex]);
    return ex;
  }

  async function handleAddSession(newSession) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: userId, date: newSession.date, entries: newSession.entries })
      .select()
      .single();
    if (error) {
      console.error("Failed to save session", error);
      setSessions((prev) => [...prev, newSession]);
      return;
    }
    setSessions((prev) => [...prev, rowToSession(data)]);
  }

  async function handleAddBodyweight(entry) {
    const { data, error } = await supabase
      .from("bodyweight")
      .upsert({ user_id: userId, date: entry.date, weight: entry.weight }, { onConflict: "user_id,date" })
      .select()
      .single();
    if (error) {
      console.error("Failed to save bodyweight", error);
      setBodyweight((prev) => [...prev.filter((b) => b.date !== entry.date), entry]);
      return;
    }
    setBodyweight((prev) => [...prev.filter((b) => b.date !== entry.date), rowToBodyweight(data)]);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!loaded) {
    return (
      <div className="carga-root flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <GlobalStyle />
        <p className="font-mono text-sm" style={{ color: "var(--paper-dim)" }}>Loading your data…</p>
      </div>
    );
  }

  return (
    <div className="carga-root">
      <GlobalStyle />
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-28 md:pb-10">
        <Header totalWorkouts={totalWorkouts} onLogout={handleLogout} />

        <div className="mt-6">
          {view === "dashboard" && (
            <Dashboard
              totalWorkouts={totalWorkouts}
              weeklyCount={weeklyCount}
              totalVolume={totalVolume}
              currentBodyweight={currentBodyweight}
              prEvents={prEvents}
              recentSessions={recentSessions}
              exercises={exercises}
              onDeleteSession={handleDeleteSession}
            />
          )}
          {view === "log" && (
            <LogWorkout
              exercises={exercises}
              sessions={sessions}
              onAddSession={handleAddSession}
              onAddExercise={handleAddExercise}
            />
          )}
          {view === "progress" && (
            <Progress exercises={exercises} sessions={sessions} />
          )}
          {view === "bodyweight" && (
            <Bodyweight
              bodyweight={bodyweight}
              onAdd={handleAddBodyweight}
              onDelete={handleDeleteBodyweight}
            />
          )}
        </div>
      </div>

      <BottomNav view={view} setView={setView} />
    </div>
  );
}

// ---------- header ----------

function Header({ totalWorkouts, onLogout }) {
  return (
    <div className="flex items-end justify-between">
      <div className="flex items-center gap-4">
        <img src="/DirtyBulk.jpg" alt="Dirty Bulk Logo" className="w-14 h-14 rounded-xl" />
        <div>
          <h1 className="font-display text-5xl leading-none" style={{ color: "var(--paper)" }}>
            DIRTY BULK
          </h1>
          <p className="font-mono text-xs mt-2 uppercase tracking-widest" style={{ color: "var(--paper-dim)" }}>
            your training log
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="hidden sm:flex flex-col items-center justify-center rounded-full font-mono flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            border: "1px solid var(--brass)",
            color: "var(--brass)",
          }}
          title="Total workouts logged"
        >
          <span className="text-lg font-semibold leading-none">{totalWorkouts}</span>
          <span style={{ fontSize: 8 }}>SESSIONS</span>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          className="p-2"
          style={{ color: "var(--paper-dim)" }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}

// ---------- navigation ----------

function BottomNav({ view, setView }) {
  const items = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "log", label: "Log", icon: Dumbbell },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "bodyweight", label: "Weight", icon: Scale },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:sticky md:bottom-auto md:mt-10"
      style={{ background: "var(--ink-soft)", borderTop: "1px solid rgba(242,238,227,0.1)" }}
    >
      <div className="max-w-3xl mx-auto grid grid-cols-4">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            data-active={view === id}
            className="nav-item flex flex-col items-center gap-1 py-3"
          >
            <Icon size={20} />
            <span className="text-xs font-mono">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- dashboard ----------

function Dashboard({
  totalWorkouts,
  weeklyCount,
  totalVolume,
  currentBodyweight,
  prEvents,
  recentSessions,
  exercises,
  onDeleteSession,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total workouts" value={totalWorkouts} icon={Dumbbell} />
        <StatCard label="This week" value={weeklyCount} icon={Flame} />
        <StatCard label="Total volume" value={totalVolume.toLocaleString("en-US")} unit="kg" icon={TrendingUp} />
        <StatCard label="Current weight" value={currentBodyweight ?? "—"} unit={currentBodyweight ? "kg" : ""} icon={Scale} />
      </div>

      <section>
        <h2 className="font-display text-xl mb-3" style={{ color: "var(--paper)" }}>
          RECENT RECORDS
        </h2>
        {prEvents.length === 0 ? (
          <EmptyState text="No records yet. Log a workout and go get that load." />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {prEvents.slice(0, 6).map((pr) => (
              <div key={pr.id} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 100 }}>
                <div className="stamp-badge">
                  <span className="font-display text-xs">RECORD</span>
                  <span className="font-mono text-sm font-bold">{pr.weight}kg</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium leading-tight">{pr.exerciseName}</p>
                  <p className="font-mono text-xs" style={{ color: "var(--paper-dim)" }}>{fmtDateShort(pr.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl mb-3" style={{ color: "var(--paper)" }}>
          RECENT WORKOUTS
        </h2>
        {recentSessions.length === 0 ? (
          <EmptyState text="No workouts logged yet. Tap «Log» to get started." />
        ) : (
          <div className="flex flex-col gap-2">
            {recentSessions.map((s) => {
              const setCount = s.entries.reduce((n, e) => n + e.sets.length, 0);
              return (
                <div key={s.id} className="card p-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm" style={{ color: "var(--paper-dim)" }}>{fmtDate(s.date)}</p>
                    <p className="text-sm mt-0.5">
                      {s.entries.length} exercise{s.entries.length !== 1 ? "s" : ""} · {setCount} set{setCount !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.entries.slice(0, 4).map((e) => {
                        const ex = exercises.find((x) => x.id === e.exerciseId);
                        return ex ? <CategoryTag key={e.id} category={ex.category} /> : null;
                      })}
                    </div>
                  </div>
                  <button onClick={() => onDeleteSession(s.id)} aria-label="Delete workout" style={{ color: "var(--paper-dim)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- log workout ----------

function LogWorkout({ exercises, sessions, onAddSession, onAddExercise }) {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState([]);
  const [pickerValue, setPickerValue] = useState("");
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState("");
  const [prModal, setPrModal] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function addExerciseToSession(exerciseId) {
    setEntries((prev) => {
      const existing = prev.find((e) => e.exerciseId === exerciseId);
      if (existing) {
        return prev.map((e) =>
          e.exerciseId === exerciseId
            ? { ...e, sets: [...e.sets, { id: uid(), weight: "", reps: "" }] }
            : e
        );
      }
      return [...prev, { id: uid(), exerciseId, sets: [{ id: uid(), weight: "", reps: "" }] }];
    });
  }

  function handlePickExercise(val) {
    if (!val) return;
    if (val === "__new__") {
      setShowNewExercise(true);
      setPickerValue("");
      return;
    }
    addExerciseToSession(val);
    setPickerValue("");
  }

  async function handleCreateExercise() {
    if (!newName.trim()) return;
    const ex = await onAddExercise(newName, newCategory);
    addExerciseToSession(ex.id);
    setNewName("");
    setNewCategory(CATEGORIES[0]);
    setShowNewExercise(false);
  }

  function updateSet(entryId, setId, field, value) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...st, [field]: value } : st)) }
          : e
      )
    );
  }

  function addSet(entryId) {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, sets: [...e.sets, { id: uid(), weight: "", reps: "" }] } : e))
    );
  }

  function removeSet(entryId, setId) {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, sets: e.sets.filter((st) => st.id !== setId) } : e))
    );
  }

  function removeEntry(entryId) {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  async function handleSave() {
    setError("");
    const cleanEntries = entries
      .map((e) => ({
        ...e,
        sets: e.sets.filter((st) => Number(st.weight) > 0 && Number(st.reps) > 0),
      }))
      .filter((e) => e.sets.length > 0);

    if (cleanEntries.length === 0) {
      setError("Add at least one set with weight and reps before saving.");
      return;
    }

    const priorBest = bestMapFrom(sessions);
    const prs = [];
    for (const e of cleanEntries) {
      const maxSet = e.sets.reduce((m, st) => (Number(st.weight) > Number(m.weight) ? st : m), e.sets[0]);
      const w = Number(maxSet.weight);
      if (w > (priorBest[e.exerciseId] || 0)) {
        const ex = exercises.find((x) => x.id === e.exerciseId);
        prs.push({ id: e.id, exerciseName: ex ? ex.name : "Exercise", weight: w, reps: maxSet.reps });
      }
    }

    const newSession = { id: uid(), date, entries: cleanEntries };
    setSaving(true);
    await onAddSession(newSession);
    setSaving(false);
    setEntries([]);

    if (prs.length > 0) {
      setPrModal(prs);
    } else {
      setToast("Workout saved!");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl" style={{ color: "var(--paper)" }}>LOG WORKOUT</h2>

      <div className="flex items-center gap-3">
        <label className="text-xs font-mono uppercase" style={{ color: "var(--paper-dim)" }}>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select value={pickerValue} onChange={(e) => handlePickExercise(e.target.value)} className="flex-1">
          <option value="">Choose exercise…</option>
          {CATEGORIES.map((cat) => {
            const items = exercises.filter((e) => e.category === cat);
            if (items.length === 0) return null;
            return (
              <optgroup key={cat} label={cat}>
                {items.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </optgroup>
            );
          })}
          <option value="__new__">+ New exercise</option>
        </select>
      </div>

      {showNewExercise && (
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New exercise</span>
            <button onClick={() => setShowNewExercise(false)} style={{ color: "var(--paper-dim)" }}>
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={handleCreateExercise} className="btn-primary py-2 text-sm">
            Add to workout
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState text="Pick an exercise above to start logging sets." />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const ex = exercises.find((x) => x.id === entry.exerciseId);
            return (
              <div key={entry.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ex ? ex.name : "Exercise"}</span>
                    {ex && <CategoryTag category={ex.category} />}
                  </div>
                  <button onClick={() => removeEntry(entry.id)} style={{ color: "var(--paper-dim)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {entry.sets.map((st, i) => (
                    <div key={st.id} className="flex items-center gap-2">
                      <span className="font-mono text-xs w-4" style={{ color: "var(--paper-dim)" }}>{i + 1}</span>
                      <input
                        type="number"
                        placeholder="kg"
                        value={st.weight}
                        onChange={(e) => updateSet(entry.id, st.id, "weight", e.target.value)}
                        className="w-20"
                      />
                      <span className="text-xs" style={{ color: "var(--paper-dim)" }}>kg ×</span>
                      <input
                        type="number"
                        placeholder="reps"
                        value={st.reps}
                        onChange={(e) => updateSet(entry.id, st.id, "reps", e.target.value)}
                        className="w-20"
                      />
                      <span className="text-xs" style={{ color: "var(--paper-dim)" }}>reps</span>
                      <button onClick={() => removeSet(entry.id, st.id)} className="ml-auto" style={{ color: "var(--paper-dim)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(entry.id)}
                    className="flex items-center gap-1 text-xs font-mono mt-1"
                    style={{ color: "var(--brass)" }}
                  >
                    <Plus size={14} /> Add set
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--stamp)" }}>{error}</p>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-primary py-3 text-sm">
        {saving ? "Saving…" : "Save workout"}
      </button>

      {toast && (
        <div
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 card px-4 py-2 flex items-center gap-2 text-sm"
          style={{ borderColor: "var(--brass)" }}
        >
          <Check size={16} style={{ color: "var(--brass)" }} /> {toast}
        </div>
      )}

      {prModal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-6 z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div className="card p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center">
            <Award size={28} style={{ color: "var(--stamp)" }} />
            <h3 className="font-display text-2xl" style={{ color: "var(--paper)" }}>
              WOO! NEW RECORDS!
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {prModal.map((pr) => (
                <div key={pr.id} className="flex flex-col items-center gap-2">
                  <div className="stamp-badge">
                    <span className="font-display text-xs">RECORD</span>
                    <span className="font-mono text-sm font-bold">{pr.weight}kg</span>
                  </div>
                  <p className="text-xs">{pr.exerciseName}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPrModal(null)}
              className="btn-primary py-2 px-6 text-sm mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- progress ----------

function Progress({ exercises, sessions }) {
  const exercisesWithData = useMemo(() => {
    const ids = new Set();
    sessions.forEach((s) => s.entries.forEach((e) => ids.add(e.exerciseId)));
    return exercises.filter((e) => ids.has(e.id));
  }, [sessions, exercises]);

  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!selectedId && exercisesWithData.length > 0) setSelectedId(exercisesWithData[0].id);
  }, [exercisesWithData, selectedId]);

  const history = useMemo(() => {
    if (!selectedId) return [];
    const rows = [];
    const relevant = [...sessions]
      .filter((s) => s.entries.some((e) => e.exerciseId === selectedId))
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const s of relevant) {
      const entry = s.entries.find((e) => e.exerciseId === selectedId);
      const maxSet = entry.sets.reduce((m, st) => (Number(st.weight) > Number(m.weight) ? st : m), entry.sets[0]);
      rows.push({
        date: s.date,
        dateLabel: fmtDateShort(s.date),
        weight: Number(maxSet.weight),
        reps: Number(maxSet.reps),
      });
    }
    return rows;
  }, [sessions, selectedId]);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl" style={{ color: "var(--paper)" }}>PROGRESS</h2>

      {exercisesWithData.length === 0 ? (
        <EmptyState text="No data yet. Log workouts to see your progress here." />
      ) : (
        <>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {exercisesWithData.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <div className="card p-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(242,238,227,0.08)" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="var(--paper-dim)" fontSize={11} />
                <YAxis stroke="var(--paper-dim)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--ink-soft)", border: "1px solid var(--brass)", borderRadius: 6 }}
                  labelStyle={{ color: "var(--paper)" }}
                  formatter={(value, name) => [name === "weight" ? `${value} kg` : value, name === "weight" ? "Top weight" : "Reps"]}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--stamp)" strokeWidth={2} dot={{ r: 3, fill: "var(--stamp)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2">
            {[...history].reverse().map((row, i) => (
              <div key={i} className="card p-3 flex items-center justify-between text-sm">
                <span className="font-mono" style={{ color: "var(--paper-dim)" }}>{row.dateLabel}</span>
                <span className="font-mono">{row.weight}kg × {row.reps}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- bodyweight ----------

function Bodyweight({ bodyweight, onAdd, onDelete }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...bodyweight].sort((a, b) => a.date.localeCompare(b.date)), [bodyweight]);
  const chartData = sorted.map((b) => ({ ...b, dateLabel: fmtDateShort(b.date) }));

  async function handleAdd() {
    if (!Number(weight) || Number(weight) <= 0) {
      setError("Enter a valid weight.");
      return;
    }
    setError("");
    setSaving(true);
    await onAdd({ date, weight: Number(weight) });
    setSaving(false);
    setWeight("");
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl" style={{ color: "var(--paper)" }}>BODY WEIGHT</h2>

      <div className="card p-4 flex flex-col sm:flex-row gap-2 items-start sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase" style={{ color: "var(--paper-dim)" }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase" style={{ color: "var(--paper-dim)" }}>Weight (kg)</label>
          <input type="number" placeholder="0.0" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-24" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="btn-primary py-2 px-4 text-sm">
          {saving ? "Saving…" : "Log"}
        </button>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--stamp)" }}>{error}</p>}

      {sorted.length === 0 ? (
        <EmptyState text="No body weight entries yet." />
      ) : (
        <>
          <div className="card p-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(242,238,227,0.08)" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="var(--paper-dim)" fontSize={11} />
                <YAxis stroke="var(--paper-dim)" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{ background: "var(--ink-soft)", border: "1px solid var(--cobalt)", borderRadius: 6 }}
                  labelStyle={{ color: "var(--paper)" }}
                  formatter={(value) => [`${value} kg`, "Weight"]}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--cobalt)" strokeWidth={2} dot={{ r: 3, fill: "var(--cobalt)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2">
            {[...sorted].reverse().map((b) => (
              <div key={b.id} className="card p-3 flex items-center justify-between text-sm">
                <span className="font-mono" style={{ color: "var(--paper-dim)" }}>{fmtDate(b.date)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{b.weight} kg</span>
                  <button onClick={() => onDelete(b.id)} style={{ color: "var(--paper-dim)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
