export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <div
          key={i}
          className="backdrop-blur-xl bg-white/40 border border-white/30 p-6 rounded-2xl shadow"
        >
          <p className="text-gray-600">{s.title}</p>
          <h3 className="text-2xl font-bold">{s.value}</h3>
        </div>
      ))}
    </div>
  );
}
