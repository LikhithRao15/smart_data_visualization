import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

export default function ChartRenderer({ analysis }) {
  if (!analysis) return null;

  const {
    columns,
    raw_numeric_rows = [],
    raw_categorical_rows = [],
    category_distribution = {},
  } = analysis;

  if (!columns || (!raw_numeric_rows.length && !raw_categorical_rows.length)) {
    return (
      <div className="text-center text-red-500 text-lg font-semibold p-4">
        Unable to generate chart — no usable data.
      </div>
    );
  }

  // Detect numeric / categorical columns
  const numericCols =
    raw_numeric_rows.length > 0 ? Object.keys(raw_numeric_rows[0]) : [];
  const categoricalCols =
    raw_categorical_rows.length > 0
      ? Object.keys(raw_categorical_rows[0])
      : [];

  const firstNum = numericCols[0];
  const secondNum = numericCols[1];
  const firstCat = categoricalCols[0];

  const chartType = (analysis.recommended_chart || "").toLowerCase();

  const isPie = chartType.includes("pie") || chartType.includes("bar");
  const isHistogram = chartType.includes("histogram");
  const isLine = chartType.includes("line");
  const isScatter = chartType.includes("scatter");

  let chartData = [];

  /* ------------------------------------------------------
     PIE CHART (Categorical)
  ------------------------------------------------------ */
  if (isPie && firstCat) {
    if (numericCols.length === 0) {
      let dist = category_distribution[firstCat] || {};

      if (!dist || Object.keys(dist).length === 0) {
        raw_categorical_rows.forEach((row) => {
          const v = row[firstCat];
          if (!v) return;
          dist[v] = (dist[v] || 0) + 1;
        });
      }

      chartData = Object.keys(dist).map((key) => ({
        name: key,
        value: dist[key],
      }));
    } else {
      const numCol = numericCols[0];
      const agg = {};

      raw_categorical_rows.forEach((row, i) => {
        const cat = row[firstCat];
        const val = raw_numeric_rows[i]?.[numCol];
        if (cat == null || val == null) return;
        agg[cat] = (agg[cat] || 0) + Number(val);
      });

      chartData = Object.keys(agg).map((key) => ({
        name: key,
        value: agg[key],
      }));
    }
  }

  /* ------------------------------------------------------
     LINE
  ------------------------------------------------------ */
  else if (isLine && raw_numeric_rows.length > 0 && firstNum) {
    chartData = raw_numeric_rows.map((row, i) => ({
      name: `Row ${i + 1}`,
      value: row[firstNum],
    }));
  }

  /* ------------------------------------------------------
     SCATTER
  ------------------------------------------------------ */
  else if (isScatter && raw_numeric_rows.length > 0) {
    if (firstNum && secondNum) {
      chartData = raw_numeric_rows.map((row) => ({
        x: row[firstNum],
        y: row[secondNum],
      }));
    } else {
      chartData = raw_numeric_rows.map((row, i) => ({
        x: i + 1,
        y: row[firstNum],
      }));
    }
  }

  /* ------------------------------------------------------
     HISTOGRAM
  ------------------------------------------------------ */
  else if (isHistogram && raw_numeric_rows.length > 0 && firstNum) {
    const values = raw_numeric_rows
      .map((r) => r[firstNum])
      .filter((v) => v != null && !isNaN(v));

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const bins = 8;
      const step = (max - min || 1) / bins;

      chartData = Array.from({ length: bins }, (_, i) => {
        const start = min + i * step;
        const end = start + step;
        const count = values.filter(
          (v) => v >= start && (i === bins - 1 ? v <= end : v < end)
        ).length;

        return {
          name: `${Math.round(start)} - ${Math.round(end)}`,
          value: count,
        };
      });
    }
  }

  /* ------------------------------------------------------
     Fallback
  ------------------------------------------------------ */
  if (!chartData.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-300 text-lg font-semibold p-6">
        No chart data available for visualization.
      </div>
    );
  }

  const colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"];

  /* ------------------------------------------------------
     DARK MODE STYLING
  ------------------------------------------------------ */
  const tooltipStyle = {
    backgroundColor: "#0f172a", // slate-900
    border: "1px solid #334155",
    color: "white",
  };

  const axisColor = "#CBD5E1"; // slate-300
  const gridColor = "#334155"; // slate-700

  /* ------------------------------------------------------
     RENDER COMPONENT
  ------------------------------------------------------ */
  return (
    <div className="w-full h-64 sm:h-80 md:h-[450px] p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl transition overflow-hidden">
      <ResponsiveContainer>
        {/* PIE */}
        {isPie && (
          <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius="70%"
                innerRadius="40%"
                label={{ fill: axisColor }}
              >
              {chartData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>

            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: axisColor }} />
          </PieChart>
        )}

        {/* LINE */}
        {isLine && (
          <LineChart data={chartData}>
            <CartesianGrid stroke={gridColor} />
            <XAxis stroke={axisColor} dataKey="name" />
            <YAxis stroke={axisColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: axisColor }} />
            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} />
          </LineChart>
        )}

        {/* SCATTER */}
        {isScatter && (
          <ScatterChart>
            <CartesianGrid stroke={gridColor} />
            <XAxis dataKey="x" stroke={axisColor} />
            <YAxis dataKey="y" stroke={axisColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: axisColor }} />
            <Scatter data={chartData} fill="#EC4899" />
          </ScatterChart>
        )}

        {/* HISTOGRAM */}
        {isHistogram && (
          <BarChart data={chartData}>
            <CartesianGrid stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} angle={-20} textAnchor="end" interval={0} />
            <YAxis stroke={axisColor} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: axisColor }} />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
