import pandas as pd 
import io

COLUMN_MAP = {
    "consumption": ["consumption", "kwh", "usage"],
    "cost": ["cost", "amount", "bill"],
    "date": ["date", "month"]
}

def parse_file(file_bytes, filename):
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported File format")
    
    # Normalize column names
    df.columns = [col.strip().lower() for col in df.columns]

    # Dynamic column mapping
    mapped_columns = {}

    for standard_name, possible_names in COLUMN_MAP.items():
        for col in df.columns:
            if any(name in col for name in possible_names):
                mapped_columns[standard_name] = col
                break

    # Validate required fields
    required_fields = ["consumption", "cost", "date"]
    missing = [field for field in required_fields if field not in mapped_columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Rename columns safely
    rename_dict = {
        mapped_columns["consumption"]: "consumption",
        mapped_columns["cost"]: "cost",
        mapped_columns["date"]: "date",
    }

    df = df.rename(columns=rename_dict)

    # Convert date
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    return df