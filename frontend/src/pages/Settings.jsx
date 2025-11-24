import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [enableTrend, setEnableTrend] = useState(true);
  const [enableAnomalies, setEnableAnomalies] = useState(true);
  const [defaultChart, setDefaultChart] = useState("auto");
  const [exportFormat, setExportFormat] = useState("pdf");

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/login");
      else setUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) navigate("/login");
        else setUser(session.user);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else if (theme === "dark") {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    // system default
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }

  // Save preference
  localStorage.setItem("sdva_theme", theme);
}, [theme]);

useEffect(() => {
  const saved = localStorage.getItem("sdva_theme");
  if (saved) setTheme(saved);
}, []);

  if (!user) return null;

  return (
<div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-screen">
        <aside className="hidden md:block w-64" />

        <main className="flex-1 max-h-screen flex flex-col">
          <header className="px-4 md:px-8 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">Settings</h2>
              <p className="text-xs text-slate-400">
                Customize your visualization and analysis preferences.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              ⬅ Back to Dashboard
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {/* Theme */}
            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-2">Appearance</h3>
              <p className="text-xs text-slate-400 mb-3">
                Choose how the dashboard should look.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    theme === "light"
                      ? "bg-slate-100 text-slate-900 border-slate-300"
                      : "bg-slate-900 text-slate-200 border-slate-700"
                  }`}
                >
                  🌤 Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    theme === "dark"
                      ? "bg-slate-800 text-slate-100 border-slate-500"
                      : "bg-slate-900 text-slate-200 border-slate-700"
                  }`}
                >
                  🌙 Dark (default)
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    theme === "system"
                      ? "bg-slate-800 text-slate-100 border-slate-500"
                      : "bg-slate-900 text-slate-200 border-slate-700"
                  }`}
                >
                  💻 System
                </button>
              </div>
            </section>

            {/* Analysis options */}
            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold">Analysis Options</h3>
              <p className="text-xs text-slate-400 mb-2">
                Control what kind of analysis the backend performs.
              </p>

              <ToggleRow
                label="Enable Trend Analysis"
                description="Estimate how numeric values change over time (only for time-series datasets)."
                checked={enableTrend}
                onChange={setEnableTrend}
              />

              <ToggleRow
                label="Enable Anomaly Detection"
                description="Detect unusual spikes/drops in numeric columns using Isolation Forest."
                checked={enableAnomalies}
                onChange={setEnableAnomalies}
              />

              <div className="mt-3">
                <p className="text-xs font-semibold mb-1">Default Chart Preference</p>
                <select
                  value={defaultChart}
                  onChange={(e) => setDefaultChart(e.target.value)}
                  className="mt-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="auto">Auto (AI choose)</option>
                  <option value="pie">Always try Pie first</option>
                  <option value="line">Prefer Line Charts</option>
                  <option value="scatter">Prefer Scatter</option>
                  <option value="histogram">Prefer Histogram</option>
                </select>
              </div>
            </section>

            {/* Export Settings */}
            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-2">Export Preferences</h3>
              <p className="text-xs text-slate-400 mb-3">
                Choose your default export format for reports.
              </p>

              <div className="flex flex-wrap gap-3">
                {["pdf", "docx", "csv", "xlsx"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-3 py-2 text-xs rounded-lg border uppercase ${
                      exportFormat === fmt
                        ? "bg-blue-500/20 border-blue-400 text-blue-200"
                        : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                (Future work) These settings can be applied when generating
                downloadable reports from your analysis.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full flex items-center px-1 transition ${
          checked ? "bg-blue-500" : "bg-slate-700"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transform transition ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
