import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

export default function Datasets() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/login");
      else setUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/login");
      else setUser(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sdva_history") || "[]");
    setHistory(stored);
  }, []);

  if (!user) return null;

  // -----------------------------
  // SAMPLE DATASETS (with CSV)
  // -----------------------------
  const sampleDatasets = [
    {
      name: "Daily Sales (Line Chart)",
      type: "Line",
      description: "Time-series dataset for testing line charts.",
      csv: `Date,Sales
2025-01-01,120
2025-01-02,150
2025-01-03,170
2025-01-04,90
2025-01-05,200`,
    },
    {
      name: "Category Sales (Pie Chart)",
      type: "Pie",
      description: "Categorical dataset for pie chart visualization.",
      csv: `Category,Value
Books,3
Clothing,2
Drawing,5
Games,7
Electronics,5`,
    },
    {
      name: "Product Ratings (Histogram)",
      type: "Histogram",
      description: "Single numeric column to test histogram distribution.",
      csv: `Rating
1
2
3
4
4
4
5
5
5
5`,
    },
    {
      name: "Height vs Weight (Scatter Plot)",
      type: "Scatter",
      description: "Two numeric columns for scatter plot correlation.",
      csv: `Height,Weight
150,50
155,53
160,56
165,60
170,65
175,70
180,75`,
    },
  ];

  // -----------------------------
  // DOWNLOAD SAMPLE CSV FUNCTION
  // -----------------------------
  function downloadCSV(dataset) {
    const blob = new Blob([dataset.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = dataset.name + ".csv";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // -----------------------------
  // DELETE FROM HISTORY
  // -----------------------------
  function deleteItem(idx) {
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated);
    localStorage.setItem("sdva_history", JSON.stringify(updated));
  }

  // -----------------------------
  // SEARCH FILTER
  // -----------------------------
  const filteredHistory = history.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex h-screen">
        <aside className="hidden md:block w-64" />

        <main className="flex-1 max-h-screen flex flex-col">
          {/* Header */}
          <header className="px-4 md:px-8 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">Datasets Library</h2>
              <p className="text-xs text-slate-400">
                Explore sample datasets and your upload history.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              ⬅ Back to Dashboard
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-10">
            {/* USER HISTORY SECTION */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Your Recent Uploads</h3>

              {/* Search bar */}
              <input
                type="text"
                placeholder="Search by filename..."
                className="px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 mb-4 w-full max-w-sm"
                onChange={(e) => setSearch(e.target.value)}
              />

              {filteredHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No matching datasets found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-slate-800">Filename</th>
                        <th className="px-4 py-3 text-left border-b border-slate-800">Rows</th>
                        <th className="px-4 py-3 text-left border-b border-slate-800">Chart</th>
                        <th className="px-4 py-3 text-left border-b border-slate-800">Date</th>
                        <th className="px-4 py-3 text-left border-b border-slate-800">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-2 border-b border-slate-800">{item.filename}</td>
                          <td className="px-4 py-2 border-b border-slate-800">{item.rows}</td>
                          <td className="px-4 py-2 border-b border-slate-800">
                            {item.recommended_chart}
                          </td>
                          <td className="px-4 py-2 border-b border-slate-800">
                            {new Date(item.analyzed_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 border-b border-slate-800">
                            <button
                              onClick={() => deleteItem(idx)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SAMPLE DATASETS SECTION */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Sample Datasets</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {sampleDatasets.map((ds, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold">{ds.name}</h4>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                        {ds.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-2">{ds.description}</p>

                    <pre className="text-[10px] bg-slate-950/60 border border-slate-800 rounded-lg p-2 mb-2 overflow-x-auto">
                      {ds.csv}
                    </pre>

                    <button
                      onClick={() => downloadCSV(ds)}
                      className="px-3 py-1 text-xs bg-blue-600 rounded-lg hover:bg-blue-500"
                    >
                      ⬇ Download CSV
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
