# 📊 Energy Analytics Dashboard (MVP)

An AI-powered full-stack energy analytics platform that processes electricity usage data from CSV/Excel files and generates insights, metrics, and interactive visualizations.

---

## 🚀 Overview

This application allows users to upload energy consumption data and:

- Parse and normalize datasets
- Compute key business metrics
- Visualize trends and anomalies
- Interact with a modern dashboard UI
- Lay the foundation for AI-driven analytics (anomaly detection, forecasting, etc.)

---

## ✨ Features

### 📁 Data Ingestion

- Upload CSV / Excel files
- Drag & drop support
- Paste CSV input directly

### 🔄 Data Processing

- Automatic parsing and normalization
- Flexible column mapping
- Data validation and error handling

### 📊 Metrics

- Total energy consumption (kWh)
- Total energy cost
- Cost per kWh
- Month-over-month trends

### 📈 Visualizations

- Line charts (consumption trends)
- Bar charts (monthly comparison)
- Area charts (growth trends)
- Anomaly highlighting

### 🧠 AI-Ready Extensions

- Anomaly detection
- Forecasting models
- Pattern recognition
- Insight generation

---

## 🏗️ Tech Stack

### Backend

- FastAPI
- Pandas
- Python 3.10+
- Uvicorn

### Frontend

- Next.js (App Router)
- React
- Axios
- Recharts
- Tailwind CSS
- Framer Motion
- Lucide Icons

---

## 📂 Project Structure

```text
energy-dashboard/
│
├── backend/
│   ├── main.py
│   ├── __init__.py
│   └── services/
│       ├── __init__.py
│       └── parser.py
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── components/
│   ├── shared/
│   └── styles/
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

## 🖥️ Backend Setup

### Create virtual environment

```bash
python -m venv venv
```

Activate:

**Windows**

```bash
venv\Scripts\activate
```

**Mac/Linux**

```bash
source venv/bin/activate
```

### Install dependencies

```bash
pip install fastapi uvicorn pandas openpyxl python-multipart
```

### Run backend

```bash
uvicorn backend.main:app --reload
```

API available at:

```
http://127.0.0.1:8000/docs
```

---

## 🌐 Frontend Setup

### Install dependencies

```bash
cd frontend
npm install
```

### Run frontend

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔌 Frontend Architecture

### App Layer

- Built using **Next.js App Router**
- Main dashboard lives in:

  ```
  frontend/app/page.tsx
  ```

- Handles:
  - UI rendering
  - State management
  - User interactions
  - Theme switching (light/dark)

---

### Services Layer

Centralized API communication:

```
frontend/services/api.ts
```

Responsibilities:

- Handles HTTP requests to backend
- Uploads files (CSV/Excel)
- Returns parsed and processed data
- Keeps UI decoupled from backend logic

Example responsibilities:

- `uploadFile(file)`
- API base configuration
- Request/response handling

---

## 📤 API Endpoints

### `POST /upload`

Upload a CSV or Excel file.

**Request:**

- `file` (form-data)

**Response:**

```json
{
  "columns": ["date", "consumption", "cost"],
  "preview": [...],
  "monthly": [...],
  "metrics": {
    "total_consumption": 12345,
    "total_cost": 6789,
    "cost_per_kwh": 0.55
  }
}
```

---

## 📌 Supported File Formats

- CSV (`.csv`)
- Excel (`.xlsx`, `.xls`)

---

## 🧠 Data Mapping Logic

| Standard Field | Variations              |
| -------------- | ----------------------- |
| consumption    | kwh, usage, consumption |
| cost           | cost, amount, bill      |
| date           | date, month             |

---

## ⚠️ Requirements

Files must include:

- Date / Month
- Consumption
- Cost

Missing fields will trigger validation errors.

---

## 🧪 Example Input

```csv
Date,Consumption,Cost
2024-01,1000,250
2024-02,1200,300
```

---

## 🛣️ Roadmap

- [x] Backend API (FastAPI)
- [x] File parsing & normalization
- [x] Frontend dashboard (Next.js)
- [x] Charts & visualizations
- [x] API service layer
- [x] Theme support (light/dark)
- [ ] AI anomaly detection
- [ ] Forecasting models
- [ ] PDF report generation
- [ ] Invoice OCR integration
- [ ] User authentication

---

## 📄 License

This project is for portfolio and demonstration purposes.

---

## 👨‍💻 Author

Built as a full-stack MVP demonstrating:

- API design and backend engineering
- Scalable frontend architecture
- Data processing pipelines
- UI/UX dashboard design
- Integration between frontend and backend services
