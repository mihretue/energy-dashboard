from fastapi import HTTPException
import pandas as pd
import io

COLUMN_MAP = {
    "consumption": ["consumption", "kwh", "usage"],
    "cost": ["cost", "amount", "bill"],
    "date": ["date", "month"]
}

def parse_file(file_bytes, filename):
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes), sep=None, engine="python")
        print("RAW COLUMNS:", df.columns.tolist())
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Normalize column names
    df.columns = [col.strip().lower() for col in df.columns]
    print("NORMALIZED COLUMNS:", df.columns.tolist())

    if len(df.columns) == 1:
        raise HTTPException(
            status_code=400,
            detail="File parsing failed. Ensure correct delimiter (comma, semicolon, etc.)"
        )

    # Dynamic column mapping
    mapped_columns = {}

    for standard_name, possible_names in COLUMN_MAP.items():
        for col in df.columns:
            if any(name == col or name in col for name in possible_names):
                mapped_columns[standard_name] = col
                break

    print("Mapped columns:", mapped_columns)

    # Validate required fields
    required_fields = ["consumption", "cost", "date"]
    missing = [field for field in required_fields if field not in mapped_columns]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing}"
        )

    # Rename columns
    df = df.rename(columns={
        mapped_columns["consumption"]: "consumption",
        mapped_columns["cost"]: "cost",
        mapped_columns["date"]: "date",
    })

    # Convert numeric
    df["consumption"] = pd.to_numeric(df["consumption"], errors="coerce")
    df["cost"] = pd.to_numeric(df["cost"], errors="coerce")

    df = df.dropna(subset=["consumption", "cost"])

    # Convert date
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    return df