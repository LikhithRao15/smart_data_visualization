export default function AnalysisSummary({ analysis }) {
  if (!analysis) return null;

  const {
    columns,
    rows,
    recommended_chart,
    anomalies,
    summary,
  } = analysis;

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-xl rounded-xl p-4 sm:p-6 mt-6 sm:mt-10">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        📊 Data Insights & Interpretation
      </h2>

      {/* Basic Details */}
      <div className="mb-6 text-slate-300 space-y-1 text-sm sm:text-base">
        <p><strong className="text-slate-100">Total Rows:</strong> {rows}</p>
        <p>
          <strong className="text-slate-100">Columns Detected:</strong>{" "}
          <span className="break-words">{columns.join(", ")}</span>
        </p>
        <p>
          <strong className="text-slate-100">Recommended Chart:</strong>{" "}
          <span className="text-blue-300">{recommended_chart}</span>
        </p>
      </div>

      {/* Anomaly Detection */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-red-400">
          ⚠️ Anomaly Detection
        </h3>
        <p className="text-slate-300">{anomalies}</p>
      </div>

      {/* Statistical Summary */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-indigo-300">
          📘 Statistical Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-800/50 rounded-xl shadow border border-slate-700 text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-300 text-xs sm:text-sm">
                <th className="px-3 py-2">Column</th>
                <th className="px-3 py-2">Count</th>
                <th className="px-3 py-2">Mean</th>
                <th className="px-3 py-2">Min</th>
                <th className="px-3 py-2">Max</th>
                <th className="px-3 py-2">Std</th>
                <th className="px-3 py-2">Top</th>
                <th className="px-3 py-2">Freq</th>
              </tr>
            </thead>

            <tbody>
              {Object.keys(summary).map((col, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-700 text-center text-xs sm:text-sm hover:bg-slate-700/30 transition"
                >
                  <td className="px-3 py-2 font-medium text-slate-200 text-left whitespace-normal break-words">
                    {col}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {summary[col].count ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-blue-300">
                    {summary[col].mean ?? "-"}
                  </td>
                  <td className="px-3 py-2">{summary[col].min ?? "-"}</td>
                  <td className="px-3 py-2">{summary[col].max ?? "-"}</td>
                  <td className="px-3 py-2">{summary[col].std ?? "-"}</td>
                  <td className="px-3 py-2 text-purple-300">
                    {summary[col].top ?? "-"}
                  </td>
                  <td className="px-3 py-2">{summary[col].freq ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
