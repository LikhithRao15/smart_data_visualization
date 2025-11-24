export default function AIInsights({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700 shadow-xl rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">AI Insights Summary</h3>

      <ul className="list-disc pl-4 sm:pl-6 space-y-2">
        {insights.map((line, i) => (
          <li key={i} className="text-slate-300 text-sm md:text-base leading-relaxed">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
