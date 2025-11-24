import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

app = FastAPI(title="Smart Data Visualization & Analysis API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def clean_json(obj):
    """Fix NaN / inf / numpy types so JSON output never breaks frontend."""
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_json(v) for v in obj]

    try:
        if pd.isna(obj):
            return None
    except:
        pass

    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj) if np.isfinite(obj) else None

    if isinstance(obj, float) and not np.isfinite(obj):
        return None

    return obj


def detect_date_columns(df):
    """Strict detection: only real date columns."""
    date_cols = []
    for col in df.columns:

        # Must be string or datetime-like types
        if df[col].dtype in ["datetime64[ns]", "datetime64[ns, UTC]"]:
            date_cols.append(col)
            continue

        # Try parsing 5 sample values only
        sample_values = df[col].dropna().astype(str).head(5)

        success = 0
        for val in sample_values:
            # Accept only formats containing digits and date separators
            if any(sep in val for sep in ["-", "/", ":"]):
                try:
                    pd.to_datetime(val, errors="raise")
                    success += 1
                except:
                    pass

        # If 80% of sample looks like dates → treat as date
        if len(sample_values) > 0 and success / len(sample_values) >= 0.8:
            date_cols.append(col)

    return date_cols


def generate_ai_insights(df, summary, trend, anomaly_info):
    insights = []

    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # 1️⃣ Categorical insights
    if categorical_cols:
        for col in categorical_cols:
            vc = df[col].value_counts()
            top = vc.idxmax()
            count = vc.max()
            insights.append(
                f"In '{col}', the most frequent category is '{top}' appearing {count} times."
            )

    # 2️⃣ Numeric insights
    if numeric_cols:
        for col in numeric_cols:
            col_values = df[col].dropna()
            mean = col_values.mean()
            min_val = col_values.min()
            max_val = col_values.max()
            insights.append(
                f"For numeric column '{col}', values range from {min_val} to {max_val} with an average of {mean:.2f}."
            )

    # 3️⃣ Trend explanation
    if trend:
        insights.append(f"Trend Analysis: {trend}.")

    # 4️⃣ Anomalies explanation
    anomaly_count = anomaly_info["count"]
    if anomaly_count > 0:
        anomaly_rows = [i+1 for i, f in enumerate(anomaly_info["flags"]) if f == 1]
        insights.append(
            f"Anomaly Detection: Found {anomaly_count} anomaly points at rows {anomaly_rows}."
        )
    else:
        insights.append("No anomalies were detected in this dataset.")

    return insights



def generate_summary(df: pd.DataFrame):
    summary = {}
    for col in df.columns:
        ser = df[col]

        # categorical
        if ser.dtype == "object" or ser.dtype == "category":
            try:
                mode_val = ser.mode().iloc[0] if not ser.mode().empty else None
                freq_val = ser.value_counts().max() if not ser.value_counts().empty else None
            except:
                mode_val, freq_val = None, None

            summary[col] = {
                "count": int(ser.count()),
                "unique": int(ser.nunique()),
                "top": str(mode_val) if mode_val else None,
                "freq": int(freq_val) if freq_val else None,
            }

        # numeric
        else:
            clean = pd.to_numeric(ser, errors="coerce").dropna()
            if clean.empty:
                summary[col] = {"count": 0, "mean": None, "min": None, "max": None, "std": None}
            else:
                summary[col] = {
                    "count": int(clean.count()),
                    "mean": float(clean.mean()),
                    "min": float(clean.min()),
                    "max": float(clean.max()),
                    "std": float(clean.std()),
                }
    return summary


def recommend_chart(df):
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    date_cols = detect_date_columns(df)

    # DATE → Line chart
    if len(date_cols) >= 1 and len(numeric_cols) >= 1:
        return "Line Chart"

    # Pure categorical or dominant categorical → Pie
    if len(categorical_cols) >= 1 and len(numeric_cols) <= 1:
        return "Pie Chart"

    # 2 numeric → Scatter plot
    if len(numeric_cols) >= 2:
        return "Scatter Plot"

    # 1 numeric → Histogram
    if len(numeric_cols) == 1:
        return "Histogram"

    return "Pie Chart"


def time_series_trend(df, date_col, numeric_col):
    """Returns accurate trend only for time-series datasets."""
    try:
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(by=date_col)

        # Fit regression
        y = df[numeric_col].values
        X = np.arange(len(y)).reshape(-1, 1)

        model = LinearRegression()
        model.fit(X, y)

        slope = model.coef_[0]
        trend = "Upward" if slope > 0 else "Downward" if slope < 0 else "Stable"

        future_indices = np.array([[len(y)], [len(y)+1], [len(y)+2]])
        forecast = model.predict(future_indices).round(2).tolist()

        return {
            "enabled": True,
            "date_column": date_col,
            "value_column": numeric_col,
            "trend": trend,
            "slope": round(slope, 2),
            "future_values": forecast,
        }
    except:
        return {"enabled": False}


def detect_trend(df: pd.DataFrame):
    """Simple trend detection (non-time-series) using numeric column."""
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if not numeric_cols:
        return "No numeric data"

    col = numeric_cols[0]
    ser = pd.to_numeric(df[col], errors="coerce").dropna()

    if len(ser) < 3:
        return "Not enough data to detect trend"

    if ser.iloc[-1] > ser.mean():
        return f"Upward trend in {col}"
    else:
        return f"Stable/Downward trend in {col}"


def detect_anomalies(df: pd.DataFrame):
    numeric = df.select_dtypes(include="number").columns.tolist()
    if not numeric:
        return {"count": 0, "flags": []}

    try:
        clean = df[numeric].apply(pd.to_numeric, errors="coerce").dropna()
        if clean.shape[0] < 3:
            return {"count": 0, "flags": [0] * len(df)}

        model = IsolationForest(contamination=0.1, random_state=42)
        preds = model.fit_predict(clean[numeric])

        flags = [0] * len(df)
        for idx, pred in zip(clean.index, preds):
            flags[idx] = 1 if pred == -1 else 0

        return {"count": sum(flags), "flags": flags}
    except:
        return {"count": 0, "flags": [0] * len(df)}


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        name = file.filename.lower()
        raw = await file.read()

        if not raw:
            return {"error": "Empty file uploaded"}

        # ---------------------------
        # FILE PARSING
        # ---------------------------
        if name.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(raw))
            except:
                df = pd.read_csv(io.StringIO(raw.decode("utf-8", errors="replace")))

        elif name.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(raw), engine="openpyxl")

        elif name.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(raw), engine="xlrd")

        else:
            return {"error": "Unsupported file format"}

        if df.empty:
            return {"error": "File contains no rows"}

        # ---------------------------
        # ANALYSIS
        # ---------------------------
        summary = generate_summary(df)
        recommended = recommend_chart(df)

        # --- Trend detection (basic) ---
        trend = detect_trend(df)

        # --- Anomaly detection ---
        anomaly_info = detect_anomalies(df)
        anomalies = f"{anomaly_info['count']} anomalies detected"
        anomaly_flags = anomaly_info["flags"]

        # --- Column types ---
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        date_cols = detect_date_columns(df)

        # --- AI Insights ---
        ai_insights = generate_ai_insights(df, summary, trend, anomaly_info)

        # ---------------------------
        # RAW ROWS
        # ---------------------------
        raw_numeric_rows = (
            df[numeric_cols].apply(lambda col: pd.to_numeric(col, errors="coerce"))
            .where(pd.notnull(df[numeric_cols]), None)
            .to_dict(orient="records")
            if numeric_cols else []
        )

        raw_categorical_rows = (
            df[categorical_cols]
            .where(pd.notnull(df[categorical_cols]), None)
            .to_dict(orient="records")
            if categorical_cols else []
        )

        # ---------------------------
        # CATEGORICAL DISTRIBUTION
        # ---------------------------
        category_distribution = {
            col: df[col].value_counts(dropna=True).to_dict()
            for col in categorical_cols
        }

        # ---------------------------
        # TRUE TIME SERIES TREND
        # ---------------------------
        if date_cols and numeric_cols:
            ts = time_series_trend(df, date_cols[0], numeric_cols[0])
        else:
            ts = {"enabled": False}

        # ---------------------------
        # FINAL RESULT
        # ---------------------------
        result = {
            "filename": file.filename,
            "columns": df.columns.tolist(),
            "rows": len(df),
            "summary": summary,
            "recommended_chart": recommended,
            "anomalies": anomalies,
            "anomaly_flags": anomaly_flags,
            "raw_numeric_rows": raw_numeric_rows,
            "raw_categorical_rows": raw_categorical_rows,
            "category_distribution": category_distribution,
            "time_series": ts,
            "ai_insights": ai_insights
        }

        return clean_json(result)

    except Exception as e:
        return {"error": str(e)}


@app.get("/")
def home():
    return {"message": "Smart Data Visualization API running!"}
