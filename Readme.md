# 📊 Energy Analytics Dashboard (MVP)

A simple AI-powered energy analytics dashboard that processes electricity usage data from CSV/Excel invoices and generates insights, summaries, and visualizations.

---

## 🚀 Features

- 📁 Upload CSV / Excel files
- 🔄 Automatic data parsing and normalization
- 📊 Basic metrics:
  - Total electricity consumption (kWh)
  - Total electricity cost
  - Cost per kWh

- 📈 Data preview after upload
- 🧠 Extensible structure for AI/ML features:
  - Anomaly detection
  - Usage forecasting
  - Trend analysis

---

## 🏗️ Tech Stack

### Backend

- FastAPI
- Pandas
- Python 3.10+

### Frontend (Planned / In Progress)

- Next.js
- Axios
- Charting library (Recharts / Chart.js)

---

## 📂 Project Structure

```
energy-dashboard/
│
├── backend/
│   ├── main.py
│   ├── __init__.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── parser.py
│
├── frontend/ (coming soon)
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd energy-dashboard
```

---

### 2. Create virtual environment

```bash
python -m venv venv
```

Activate it:

**Windows:**

```bash
venv\Scripts\activate
```

**Mac/Linux:**

```bash
source venv/bin/activate
```

---

### 3. Install dependencies

```bash
pip install fastapi uvicorn pandas openpyxl python-multipart
```

---

### 4. Run the backend

From the project root:

```bash
uvicorn backend.main:app --reload
```

---

### 5. Open API docs

Visit:

```
http://127.0.0.1:8000/docs
```

---

## 📤 API Endpoints

### `POST /upload`

Upload a CSV or Excel file.

**Request:**

- Form-data:
  - `file`: CSV or Excel file

**Response:**

```json
{
  "columns": ["date", "consumption", "cost"],
  "preview": [...]
}
```

---

## 📌 Supported File Formats

- CSV (.csv)
- Excel (.xlsx)

---

## 🧠 Data Mapping Logic

The system automatically maps different column names into standardized fields:

| Standard Field | Possible Variations     |
| -------------- | ----------------------- |
| consumption    | kwh, usage, consumption |
| cost           | cost, amount, bill      |
| date           | date, month             |

---

## ⚠️ Requirements

- Files must include at least:
  - Date / Month
  - Electricity Consumption
  - Electricity Cost

If required columns are missing, the system will return an error.

---

## 🧪 Example Input Format

```csv
Date,Consumption,Cost
2024-01,1000,250
2024-02,1200,300
```

---

## 🛣️ Roadmap

- [x] File upload & parsing
- [x] Data normalization
- [ ] Dashboard UI (Next.js)
- [ ] Charts & visualizations
- [ ] AI anomaly detection
- [ ] Usage forecasting (ML)
- [ ] PDF report generation
- [ ] Invoice OCR integration

---

## 📄 License

This project is for portfolio and demonstration purposes.

---

## 👨‍💻 Author

Built as part of an AI/Data analytics MVP to demonstrate:

- Data pipeline design
- API development
- AI/ML readiness
- Dashboard integration
