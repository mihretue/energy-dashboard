from fastapi import FastAPI, UploadFile, File, HTTPException
from backend.services.parser import parse_file
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
import pandas as pd
import numpy as np

app = FastAPI()

# -------------------------
# Utility
# -------------------------
def clean_for_json(df):
    return df.replace([np.inf, -np.inf], np.nan).fillna(0)

# -------------------------
# Middleware
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Route
# -------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    df = parse_file(data, file.filename)

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    required_cols = ["date", "consumption", "cost"]
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing_cols}"
        )

    # Clean + types
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "consumption", "cost"])

    # -------------------------
    # Monthly aggregation
    # -------------------------
    df["month"] = df["date"].dt.to_period("M").astype(str)

    monthly = df.groupby("month").agg({
        "consumption": "sum",
        "cost": "sum"
    }).reset_index()

    # -------------------------
    # Growth
    # -------------------------
    monthly["prev_consumption"] = monthly["consumption"].shift(1)

    monthly["growth_pct"] = (
        (monthly["consumption"] - monthly["prev_consumption"]) /
        monthly["prev_consumption"] * 100
    )

    monthly["growth_pct"] = monthly["growth_pct"].replace([np.inf, -np.inf], np.nan).fillna(0)

    # -------------------------
    # Stats
    # -------------------------
    max_month = monthly.loc[monthly["consumption"].idxmax()]
    min_month = monthly.loc[monthly["consumption"].idxmin()]

    total_consumption = df["consumption"].sum()
    total_cost = df["cost"].sum()
    cost_per_kwh = total_cost / total_consumption if total_consumption > 0 else 0

    # -------------------------
    # Anomaly Detection
    # -------------------------
    mean = monthly["consumption"].mean()
    std = monthly["consumption"].std()

    anomalies = []

    for _, row in monthly.iterrows():
        z_score = 0 if std == 0 else (row["consumption"] - mean) / std

        if abs(z_score) > 1.5:
            anomalies.append({
                "month": row["month"],
                "consumption": float(row["consumption"]),
                "z_score": float(z_score)
            })

    # -------------------------
    # Insights
    # -------------------------
    insights = []

    if monthly["consumption"].is_monotonic_increasing:
        insights.append("Consumption is steadily increasing over time.")
    elif monthly["consumption"].is_monotonic_decreasing:
        insights.append("Consumption is steadily decreasing over time.")
    else:
        insights.append("Consumption fluctuates over time.")

    avg_growth = monthly["growth_pct"].mean()
    insights.append(f"Average month-over-month growth is {avg_growth:.2f}%.")

    insights.append(
        f"Highest consumption in {max_month['month']} ({max_month['consumption']} kWh)."
    )

    insights.append(
        f"Lowest consumption in {min_month['month']} ({min_month['consumption']} kWh)."
    )

    if cost_per_kwh > 0:
        insights.append(f"Average cost per kWh is {cost_per_kwh:.2f}.")

    if anomalies:
        insights.append(f"{len(anomalies)} anomaly month(s) detected.")
    else:
        insights.append("No significant anomalies detected.")

    # -------------------------
    # Clean for JSON
    # -------------------------
    monthly = clean_for_json(monthly)
    preview = clean_for_json(df.head(5))

    # -------------------------
    # Response
    # -------------------------
    return {
        "metrics": {
            "total_consumption": float(total_consumption),
            "total_cost": float(total_cost),
            "cost_per_kwh": float(cost_per_kwh)
        },
        "monthly": monthly.to_dict(orient="records"),
        "anomalies": anomalies,
        "insights": insights,
        "preview": preview.to_dict(orient="records"),
    }


# -------------------------
# Global Error Handler
# -------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )