import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import ChartRenderer from "./components/ChartRenderer";
import AnalysisCharts from "./components/AnalysisCharts";
import AnalysisSummary from "./components/AnalysisSummary";
import AIInsights from "./components/AIInsights";

export default function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  // ----------------------------------------
  // AUTH CHECK
  // ----------------------------------------
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

  if (!user) return null;


  const generatePDF = async (analysis) => {
    const element = document.getElementById("chart-container");

    if (!element) {
      alert("Chart not loaded yet!");
      return;
    }

    // Capture chart image
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("Helvetica", "bold");
    pdf.text("Smart Data Visualization Report", 14, 20);

    // Chart Image
    pdf.addImage(imgData, "PNG", 10, 30, 190, 100);

    // Summary
    pdf.setFont("Helvetica", "normal");
    pdf.text("Summary", 14, 140);
    pdf.text(JSON.stringify(analysis.summary, null, 2), 14, 150);

    pdf.save("DataViz_Report.pdf");
  };

  // ----------------------------------------
  // UPLOAD HANDLER
  // ----------------------------------------
  const handleUpload = async (fileObj) => {
    if (!fileObj) return alert("Please select a file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileObj);

    try {
      const res = await axios.post(`https://smart-data-visualization.onrender.com/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("BACKEND RESPONSE:", res.data);
      setResult(res.data);
      const { error: insertError } = await supabase.from("analysis_history").insert([
        {
          user_id: user.id,
          filename: analysis.filename || file.name,
          rows: analysis.rows || null,
          recommended_chart: analysis.recommended_chart || null,
          analysis: analysis, // full JSON
        },
      ]);

      if (insertError) {
        console.error("Error saving history:", insertError);
      }
    } catch (err) {
      console.error(err);
      console.log("Failed to analyze file");
    } finally {
      setLoading(false);
    }

  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleUpload(file);
  };

  // Drag & drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleUpload(droppedFile);
    }
  };

  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* SIDEBAR - Desktop */}
        <aside className="hidden md:flex md:flex-col w-64 bg-slate-900/70 border-r border-slate-800 backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Smart DataViz
              </h1>
              <p className="text-[11px] text-slate-400">
                AI powered insights & charts
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            <SidebarItem
              active
              icon="📈"
              label="Dashboard"
              onClick={() => navigate("/")}
            />
            <SidebarItem
              icon="📂"
              label="Datasets"
              onClick={() => navigate("/datasets")}
            />
            <SidebarItem
              icon="⚙️"
              label="Settings"
              onClick={() => navigate("/settings")}
            />
          </nav>

          <div className="px-4 py-4 border-t border-slate-800">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-300 border border-red-500/40 py-2 text-sm hover:bg-red-500/20 transition"
            >
              🔒 Logout
            </button>
          </div>
        </aside>

        {/* SIDEBAR - Mobile Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/90 border-r border-slate-800 backdrop-blur-xl z-40 md:hidden"
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
              >
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                      📊
                    </div>
                    <h1 className="text-lg font-semibold tracking-tight">
                      Smart DataViz
                    </h1>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-slate-400 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <nav className="px-4 py-4 space-y-2">
                  <SidebarItem
                    active
                    icon="📈"
                    label="Dashboard"
                    onClick={() => {
                      navigate("/");
                      setSidebarOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon="📂"
                    label="Datasets"
                    onClick={() => {
                      navigate("/datasets");
                      setSidebarOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon="⚙️"
                    label="Settings"
                    onClick={() => {
                      navigate("/settings");
                      setSidebarOpen(false);
                    }}
                  />
                </nav>

                <div className="px-4 py-4 border-t border-slate-800 mt-auto">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/login");
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-300 border border-red-500/40 py-2 text-sm hover:bg-red-500/20 transition"
                  >
                    🔒 Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col max-h-screen">
          {/* TOP NAVBAR */}
          <header className="px-4 md:px-8 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-700"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">
                  Welcome, {user.user_metadata?.full_name || "User"}
                </h2>
                <p className="text-xs text-slate-400">
                  Analyze your datasets with AI-powered visualization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-slate-400">User ID</span>
                <span className="text-sm font-mono text-slate-200">
                  {user.id.slice(0, 8)}…
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold">
                {user.email[0].toUpperCase()}
              </div>
            </div>
          </header>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 space-y-8">
            {/* UPLOAD SECTION */}
            {!result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
              >
                <div className="grid gap-6 md:grid-cols-[2fr,1.2fr] items-start">
                  {/* Upload Card with Drag & Drop */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-xl">
                    <h3 className="text-2xl font-semibold mb-2">
                      Upload your dataset
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Supports <span className="font-mono">.csv, .xlsx, .xls</span>.
                      The system will automatically detect best chart type, trend
                      and anomalies.
                    </p>

                    <div
                      className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition 
                      ${isDragging
                          ? "border-blue-400 bg-blue-500/10"
                          : "border-slate-700 bg-slate-900/60"
                        }`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      <p className="text-sm text-slate-300">
                        Drag & drop your file here,
                      </p>
                      <p className="text-sm text-slate-400 mb-3">
                        or click below to browse.
                      </p>
                      <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                      <label
                        htmlFor="file-input"
                        className="inline-block mt-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-sm hover:bg-slate-700 cursor-pointer"
                      >
                        Choose File
                      </label>

                      {file && (
                        <p className="mt-2 text-xs text-blue-300">
                          Selected: <span className="font-mono">{file.name}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={onSubmit}
                      disabled={loading || !file}
                      className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                    >
                      {loading ? "Analyzing..." : "Analyze Data"}
                    </button>
                  </div>

                  {/* Info / Feature Highlights */}
                  <div className="space-y-4">
                    <InfoCard
                      title="Smart Chart Suggestion"
                      description="Automatically recommends the best chart type based on your columns — pie, line, scatter, or histogram."
                      icon="💡"
                    />
                    <InfoCard
                      title="Trend & Anomaly Detection"
                      description="Detects unusual spikes or drops and estimates how values may move in the future."
                      icon="📈"
                    />
                    <InfoCard
                      title="AI Insights in Simple English"
                      description="Generates natural language summaries so any user can understand the data story."
                      icon="🧠"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESULT DASHBOARD */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title="Filename" value={result.filename} />
                  <StatCard title="Rows" value={result.rows} />
                  <StatCard
                    title="Recommended Chart"
                    value={result.recommended_chart}
                  />
                </div>

                {/* Main Chart */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 chart-container" id="chart-container">
                  <h3 className="text-lg font-semibold mb-3">Primary Visualization</h3>
                  <ChartRenderer analysis={result} />
                </div>

                {/* Extra Charts (anomaly / distribution) */}
                <AnalysisCharts analysis={result} />

                {/* Time series trend (only if available) */}
                {result.time_series?.enabled && (
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
                    <h3 className="text-lg font-semibold mb-3">
                      Time-Series Trend Analysis
                    </h3>
                    <p className="text-sm text-slate-300">
                      <strong>Current Trend:</strong>{" "}
                      {result.time_series.current_trend}
                    </p>
                    <p className="text-sm text-slate-300 mt-3">
                      <strong>Future Prediction (next 3 steps):</strong>
                    </p>
                    <pre className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 mt-2 text-xs text-slate-200">
                      {JSON.stringify(result.time_series.future_values, null, 2)}
                    </pre>
                  </div>
                )}
                <button
                  onClick={() => generatePDF(result)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                >
                  📄 Download Report (PDF)
                </button>


                {/* AI insights in words */}
                {result.ai_insights && (
                  <AIInsights insights={result.ai_insights} />
                )}

                {/* Stats summary table */}
                <AnalysisSummary analysis={result} />

                {/* Reset */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
                    className="mt-2 px-6 py-2 rounded-xl bg-slate-800 border border-slate-600 text-sm hover:bg-slate-700"
                  >
                    Upload Another File
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm 
        ${active
          ? "bg-slate-800 text-slate-50"
          : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InfoCard({ title, description, icon }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
          {icon}
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow backdrop-blur-xl"
    >
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-semibold break-all">{value}</p>
    </motion.div>
  );
}
