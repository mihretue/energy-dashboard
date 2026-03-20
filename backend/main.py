from fastapi import FastAPI, UploadFile, File
from backend.services.parser import parse_file
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    df = parse_file(data, file.filename)

    # Ensure required columns exist
    df = df.dropna(subset=["date", "consumption", "cost"])

    # Monthly aggregation
    df["month"] = df["date"].dt.to_period("M").astype(str)

    monthly = df.groupby("month").agg({
        "consumption": "sum",
        "cost": "sum"
    }).reset_index()

    total_consumption = df["consumption"].sum()
    total_cost = df["cost"].sum()
    cost_per_kwh = total_cost / total_consumption if total_consumption else 0
    
    # Convert monthly consumption to list

    consumption_values = monthly["consumption"]
    mean = consumption_values.mean()
    std = consumption_values.std()

    anomalies = []

    for _, row in monthly.iterrows():
        if std == 0:
            z_score = 0 
        else:
            z_score = (row["consumption"]- mean)/std
            
        # Thershold for anomaly
        if abs(z_score) > 1.5:
            anomalies.append({
                "month": row["month"],
                "consumption": row["consumption"],
                "z_score": float(z_score)
            })
            
    insights = []

    # Trend insight
    if monthly["consumption"].is_monotonic_increasing:
        insights.append("Consumption is steadily increasing over time.")
    elif monthly["consumption"].is_monotonic_decreasing:
        insights.append("Consumption is steadily decreasing over time.")
    else:
        insights.append("Consumption shows fluctuations over time.")

    # High anomaly insight
    if anomalies:
        insights.append(f"{len(anomalies)} unusual usage month(s) detected.")
    else:
        insights.append("No unusual usage patterns detected.")

    return {
        "metrics": {
            "total_consumption": total_consumption,
            "total_cost": total_cost,
            "cost_per_kwh": cost_per_kwh
        },
        "monthly": monthly.to_dict(orient="records"),
        "anomalies": anomalies,
        "insights": insights,
        "preview": df.head(5).to_dict(orient="records")
    }
    


