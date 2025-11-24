import { useState } from "react";
import axios from "axios";
import StatsGrid from "../components/StatsGrid";
import ChartRenderer from "../components/ChartRenderer";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first!");

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze", formData);
      setResult(res.data);
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    }

    setLoading(false);
  };

  const stats = result
    ? [
        { title: "File", value: result.filename },
        { title: "Rows", value: result.rows },
        { title: "Chart Type", value: result.recommended_chart },
      ]
    : [];

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0">

      {/* Upload Panel */}
      {!result && (
        <div className="bg-white/40 backdrop-blur-xl p-6 sm:p-10 rounded-2xl shadow-xl max-w-full sm:max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">Upload Dataset</h2>

          <form onSubmit={upload} className="space-y-4 sm:space-y-5">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="w-full p-3 rounded-lg bg-white shadow text-sm sm:text-base"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </form>
        </div>
      )}

      {/* Dashboard Data */}
      {result && (
        <>
          <StatsGrid stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white/40 border border-white/30 shadow-xl rounded-2xl p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Visualization</h3>
              <ChartRenderer analysis={result} />
            </div>

            <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow">
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Raw Output</h3>
              <pre className="text-xs sm:text-sm p-3 bg-white/60 rounded-lg overflow-x-auto max-h-72 sm:max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
