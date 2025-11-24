import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalysisCharts({ analysis }) {
  if (!analysis) return null;

  const { raw_numeric_rows = [], anomaly_flags = [] } = analysis;
  if (!raw_numeric_rows.length) return null;

  const numericCols =
    raw_numeric_rows.length > 0 ? Object.keys(raw_numeric_rows[0]) : [];
  const firstNum = numericCols[0];

  if (!firstNum) return null;

  // Prepare data
  const data = raw_numeric_rows.map((row, i) => ({
    index: i + 1,
    value: row[firstNum],
    isAnomaly: anomaly_flags[i] === 1,
  }));

  const anomalyPoints = data.filter((d) => d.isAnomaly);

  /* ----------------------------------------
     Dark Mode Chart Styles
  ---------------------------------------- */
  const axisColor = "#CBD5E1"; // slate-300
  const gridColor = "rgba(148,163,184,0.2)"; // slate-400 opacity
  const tooltipStyle = {
    backgroundColor: "#0f172a", // slate-900
    border: "1px solid #334155",
    color: "white",
    fontSize: "12px",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

      {/* ------------------------------------------------------------
           TREND LINE CHART
      ------------------------------------------------------------ */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700 shadow-xl rounded-xl p-4 sm:p-6 transition">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">
          Trend Analysis ({firstNum})
        </h3>

        <div className="w-full h-56 sm:h-64 md:h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke={gridColor} />
              <XAxis
                dataKey="index"
                tick={{ fill: axisColor }}
                tickFormatter={(v) => `Row ${v}`}
                stroke={axisColor}
              />
              <YAxis stroke={axisColor} tick={{ fill: axisColor }} />

              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: axisColor }} />

              <Line
                type="monotone"
                dataKey="value"
                name={firstNum}
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------------------------------------
           ANOMALY DETECTION CHART
      ------------------------------------------------------------ */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700 shadow-xl rounded-xl p-4 sm:p-6 transition">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">
          Anomaly Detection ({firstNum})
        </h3>

        <div className="w-full h-56 sm:h-64 md:h-72">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke={gridColor} />

              <XAxis
                dataKey="index"
                name="Row"
                tick={{ fill: axisColor }}
                stroke={axisColor}
                tickFormatter={(v) => `Row ${v}`}
              />
              <YAxis
                dataKey="value"
                name={firstNum}
                tick={{ fill: axisColor }}
                stroke={axisColor}
              />

              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: axisColor }} />

              {/* Normal values */}
              <Scatter
                name="Normal"
                data={data}
                fill="#10B981"
                shape="circle"
              />

              {/* Anomalies */}
              {anomalyPoints.length > 0 && (
                <Scatter
                  name="Anomaly"
                  data={anomalyPoints}
                  fill="#EF4444"
                  shape="circle"
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
