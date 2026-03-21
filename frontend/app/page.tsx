"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
  ComposedChart,
  Cell,
  ReferenceLine,
  ZAxis,
} from "recharts";

// --- Helper Functions ---
const formatMonth = (monthStr: string) => {
  if (!monthStr) return monthStr;
  const [year, month] = monthStr.split("-");
  if (!year || !month) return monthStr;
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
};

// --- Reusable Components ---
const KPICard = ({
  title,
  value,
  unit,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
        {title}
      </h3>
    </div>
    <p className="text-3xl font-bold text-slate-800">
      {typeof value === "number" ? value.toLocaleString() : value}
      {unit && (
        <span className="text-lg font-normal text-slate-500"> {unit}</span>
      )}
    </p>
  </div>
);

const LoadingSkeleton = ({
  count = 1,
  height = "h-64",
}: {
  count?: number;
  height?: string;
}) => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`bg-slate-200 rounded-xl ${height}`}></div>
    ))}
  </div>
);

const ErrorAlert = ({ message }: { message: string }) => (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
    <span>⚠️</span> {message}
  </div>
);

const UploadArea = ({
  file,
  csvText,
  loading,
  csvUploading,
  onFileChange,
  onFileClear,
  onCsvChange,
  onCsvClear,
  onFileUpload,
  onCsvUpload,
}: {
  file: File | null;
  csvText: string;
  loading: boolean;
  csvUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileClear: () => void;
  onCsvChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCsvClear: () => void;
  onFileUpload: () => void;
  onCsvUpload: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6">
        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Upload a CSV or Excel file
          </label>
          <div
            onClick={triggerFileSelect}
            className={`relative flex items-center justify-between border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
              file
                ? "border-indigo-300 bg-indigo-50/30"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📂</span>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : "Click to select or drag and drop"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "Supports .csv, .xlsx, .xls"}
                </p>
              </div>
            </div>
            {file && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClear();
                }}
                className="text-slate-400 hover:text-red-500 transition p-1 rounded-full">
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            className="hidden"
          />
          <button
            onClick={onFileUpload}
            disabled={!file || loading}
            className={`mt-4 w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              !file || loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md"
            }`}>
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              "Upload & Analyze"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">or</span>
          </div>
        </div>

        {/* Paste CSV */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste CSV content
          </label>
          <textarea
            rows={5}
            className="w-full border border-slate-300 rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="month,consumption,cost
2023-01,1200,180
2023-02,1100,165"
            value={csvText}
            onChange={onCsvChange}
            disabled={csvUploading}
          />
          <div className="flex justify-end gap-3 mt-3">
            {csvText && (
              <button
                onClick={onCsvClear}
                className="px-4 py-2 text-sm text-slate-600 hover:text-red-600 transition"
                disabled={csvUploading}>
                Clear
              </button>
            )}
            <button
              onClick={onCsvUpload}
              disabled={!csvText.trim() || csvUploading}
              className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                !csvText.trim() || csvUploading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md"
              }`}>
              {csvUploading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                "Upload Pasted CSV"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ text }: { text: string }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="text-indigo-500 text-xl">💡</span>
      <p className="text-slate-700 text-sm">{text}</p>
    </div>
  </div>
);

const DataTable = ({ columns, rows }: { columns: string[]; rows: any[] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-5 border-b border-slate-100">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <span>📋</span> Data Preview
      </h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns?.map((col, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns?.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Main Dashboard Component ---
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/";
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) setCsvText("");
    setData(null);
    setError("");
  };

  const clearFile = () => {
    setFile(null);
    if (document.querySelector('input[type="file"]') as HTMLInputElement) {
      (document.querySelector('input[type="file"]') as HTMLInputElement).value =
        "";
    }
    setData(null);
    setError("");
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
    setData(null);
    setError("");
  };

  const clearCsv = () => {
    setCsvText("");
    setData(null);
    setError("");
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_URL}upload`, formData);
      setData(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Upload failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadPastedCsv = async () => {
    if (!csvText.trim()) {
      setError("Please paste some CSV content.");
      return;
    }
    setCsvUploading(true);
    setError("");
    try {
      const blob = new Blob([csvText], { type: "text/csv" });
      const csvFile = new File([blob], "pasted-data.csv", { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await axios.post(`${API_URL}upload`, formData);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid CSV format.");
    } finally {
      setCsvUploading(false);
    }
  };

  // Prepare chart data with annotations
  const monthlyData =
    data?.monthly?.map((item: any) => ({
      ...item,
      displayMonth: formatMonth(item.month),
    })) || [];

  // Find highest and lowest consumption months
  let highestMonth = null;
  let lowestMonth = null;
  if (monthlyData.length) {
    highestMonth = monthlyData.reduce(
      (max: any, m: any) => (m.consumption > max.consumption ? m : max),
      monthlyData[0],
    );
    lowestMonth = monthlyData.reduce(
      (min: any, m: any) => (m.consumption < min.consumption ? m : min),
      monthlyData[0],
    );
  }

  // Anomaly points for line chart
  const anomalyPoints = monthlyData.filter((item: any) =>
    data?.anomalies?.some((a: any) => a.month === item.month),
  );

  // Bar chart colors: anomalies in red, highest in green, lowest in orange, others blue
  const getBarColor = (item: any) => {
    if (data?.anomalies?.some((a: any) => a.month === item.month))
      return "#ef4444";
    if (highestMonth && item.month === highestMonth.month) return "#10b981";
    if (lowestMonth && item.month === lowestMonth.month) return "#f59e0b";
    return "#3b82f6";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Energy Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your energy consumption data and get instant insights
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <UploadArea
          file={file}
          csvText={csvText}
          loading={loading}
          csvUploading={csvUploading}
          onFileChange={handleFileChange}
          onFileClear={clearFile}
          onCsvChange={handleCsvChange}
          onCsvClear={clearCsv}
          onFileUpload={uploadFile}
          onCsvUpload={uploadPastedCsv}
        />

        {/* Error Display */}
        {error && <ErrorAlert message={error} />}

        {/* Loading Skeletons */}
        {(loading || csvUploading) && !data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <LoadingSkeleton count={3} height="h-28" />
            </div>
            <div className="space-y-8 mb-8">
              <LoadingSkeleton count={2} height="h-80" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LoadingSkeleton height="h-96" />
              </div>
              <div>
                <LoadingSkeleton height="h-96" />
              </div>
            </div>
          </>
        )}

        {/* Dashboard Content */}
        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <KPICard
                title="Total Consumption"
                value={data.metrics.total_consumption}
                unit="kWh"
                icon="⚡"
              />
              <KPICard
                title="Total Cost"
                value={data.metrics.total_cost}
                unit="$"
                icon="💰"
              />
              <KPICard
                title="Avg. Cost per kWh"
                value={data.metrics.cost_per_kwh.toFixed(2)}
                unit="$/kWh"
                icon="📊"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Line Chart: Consumption over time */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📈</span> Monthly Consumption (with anomalies)
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="displayMonth"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="consumption"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      {/* Anomaly points as scatter */}
                      <Scatter
                        data={anomalyPoints}
                        dataKey="consumption"
                        fill="#ef4444"
                        shape="circle">
                        <ZAxis type="number" range={[80, 80]} />
                      </Scatter>
                      {/* Highlight highest and lowest points */}
                      {highestMonth && (
                        <ReferenceLine
                          x={highestMonth.displayMonth}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{
                            value: "Highest",
                            position: "top",
                            fill: "#10b981",
                            fontSize: 10,
                          }}
                        />
                      )}
                      {lowestMonth && (
                        <ReferenceLine
                          x={lowestMonth.displayMonth}
                          stroke="#f59e0b"
                          strokeDasharray="3 3"
                          label={{
                            value: "Lowest",
                            position: "bottom",
                            fill: "#f59e0b",
                            fontSize: 10,
                          }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Red dots: anomalies • Green dash: highest consumption • Orange
                  dash: lowest consumption
                </p>
              </div>

              {/* Bar Chart: Monthly Cost */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>💵</span> Monthly Cost
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="displayMonth"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#475569" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar dataKey="cost">
                        {monthlyData.map((entry: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={getBarColor(entry)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Red: anomaly months • Green: highest consumption month •
                  Orange: lowest consumption month
                </p>
              </div>
            </div>

            {/* Bottom Section: Insights & Data Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Insights as cards */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span>🧠</span> AI Insights
                </h2>
                {data.insights?.map((insight: string, idx: number) => (
                  <InsightCard key={idx} text={insight} />
                ))}
                {data.anomalies?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 text-xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-amber-800">
                          Anomalies Detected
                        </h3>
                        <ul className="mt-2 space-y-1 text-sm text-amber-700">
                          {data.anomalies.map((a: any, idx: number) => (
                            <li key={idx}>
                              {formatMonth(a.month)}:{" "}
                              {a.consumption.toLocaleString()} kWh (z-score:{" "}
                              {a.z_score.toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="lg:col-span-2">
                <DataTable columns={data.columns} rows={data.preview} />
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !csvUploading && !data && !error && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-800">
              No data loaded yet
            </h3>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              Upload a file or paste CSV data to see metrics, charts, and
              AI-driven insights.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
          Energy Analytics Dashboard — Powered by AI & Recharts
        </footer>
      </main>
    </div>
  );
}
