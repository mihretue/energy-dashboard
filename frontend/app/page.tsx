"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Download,
  Sun,
  Moon,
  BarChart3,
} from "lucide-react";
import { uploadFile } from "@/services/api";

// --- Helper Functions ---
const formatMonth = (monthStr: string) => {
  if (!monthStr) return monthStr;
  const [year, month] = monthStr.split("-");
  if (!year || !month) return monthStr;
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
};

// --- Reusable Components ---

// KPI Card with Trend and Sparkline – now accepts isDark
const KPICard = ({
  title,
  value,
  unit,
  icon,
  trend,
  sparklineData,
  isDark,
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  sparklineData?: { value: number }[];
  isDark: boolean;
}) => {
  const isPositive = trend ? trend > 0 : false;
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const textColor = isDark ? "text-slate-200" : "text-slate-800";
  const labelColor = isDark ? "text-slate-400" : "text-slate-500";
  const unitColor = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cardBg} rounded-2xl shadow-sm border ${border} p-5 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3
            className={`text-sm font-medium uppercase tracking-wide ${labelColor}`}>
            {title}
          </h3>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${textColor}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && (
          <span className={`text-lg font-normal ${unitColor}`}> {unit}</span>
        )}
      </p>
      {sparklineData && (
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

// Loading Skeleton – also theme-aware
const LoadingSkeleton = ({
  count = 1,
  height = "h-64",
  isDark,
}: {
  count?: number;
  height?: string;
  isDark: boolean;
}) => {
  const bg = isDark ? "bg-slate-700" : "bg-slate-200";
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${bg} rounded-xl ${height}`}></div>
      ))}
    </div>
  );
};

// Error Alert
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
    <span>⚠️</span> {message}
  </div>
);

// Success Alert
const SuccessAlert = ({ message }: { message: string }) => (
  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
    <span>✅</span> {message}
  </div>
);

// Empty State – theme-aware
const EmptyState = ({ isDark }: { isDark: boolean }) => {
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const textColor = isDark ? "text-slate-200" : "text-slate-800";
  const subColor = isDark ? "text-slate-400" : "text-slate-500";
  const iconColor = isDark ? "text-slate-500" : "text-slate-400";

  return (
    <div
      className={`text-center py-16 ${cardBg} rounded-2xl shadow-sm border ${border}`}>
      <div className="flex justify-center mb-4">
        <BarChart3 size={48} className={iconColor} />
      </div>
      <h3 className={`text-lg font-medium ${textColor}`}>No data loaded yet</h3>
      <p className={`${subColor} mt-1 max-w-md mx-auto`}>
        Upload a file or paste CSV data to see metrics, charts, and AI-driven
        insights.
      </p>
    </div>
  );
};

// Upload Area – now accepts isDark prop
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
  isDark,
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
  isDark: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      onFileChange({ target: { files: acceptedFiles } } as any);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const textColor = isDark ? "text-slate-200" : "text-slate-800";
  const labelColor = isDark ? "text-slate-300" : "text-slate-700";
  const placeholderColor = isDark ? "text-slate-400" : "text-slate-400";
  const dropzoneBg = isDark
    ? "bg-slate-700/30 hover:bg-slate-700/50"
    : "bg-slate-50 hover:bg-slate-100";
  const dragActiveBg = isDark ? "bg-slate-700" : "bg-indigo-50";
  const fileBg = isDark ? "bg-slate-700/30" : "bg-indigo-50/30";
  const fileBorder = isDark ? "border-indigo-400" : "border-indigo-300";

  return (
    <div
      className={`${cardBg} rounded-2xl shadow-sm border ${border} overflow-hidden mb-8`}>
      <div className="p-6">
        {/* File Upload with Drag & Drop */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Upload a CSV or Excel file
          </label>
          <div
            {...getRootProps()}
            className={`relative flex items-center justify-between border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
              file
                ? `${fileBorder} ${fileBg}`
                : isDragActive
                  ? `${dragActiveBg} border-indigo-500`
                  : `${dropzoneBg} border-slate-300`
            }`}>
            <input {...getInputProps()} />
            <div className="flex items-center gap-3">
              <span className="text-2xl">📂</span>
              <div>
                <p className={`text-sm font-medium ${textColor}`}>
                  {file
                    ? file.name
                    : isDragActive
                      ? "Drop the file here..."
                      : "Click or drag and drop"}
                </p>
                <p className={`text-xs ${placeholderColor} mt-0.5`}>
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
            <div
              className={`w-full border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span
              className={`px-2 ${cardBg} ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              or
            </span>
          </div>
        </div>

        {/* Paste CSV */}
        <div>
          <label className={`block text-sm font-medium ${labelColor} mb-2`}>
            Paste CSV content
          </label>
          <textarea
            rows={5}
            className={`w-full border rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
              isDark
                ? "bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400"
            }`}
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

// Structured Insight Card – theme-aware
const InsightCard = ({
  type,
  text,
  isDark,
}: {
  type: "trend" | "cost" | "anomaly" | "general";
  text: string;
  isDark: boolean;
}) => {
  const config = {
    trend: {
      icon: "📈",
      bg: isDark ? "bg-green-900/30" : "bg-green-50",
      border: isDark ? "border-green-800" : "border-green-200",
      textColor: isDark ? "text-green-300" : "text-green-800",
      iconColor: isDark ? "text-green-400" : "text-green-600",
    },
    cost: {
      icon: "💰",
      bg: isDark ? "bg-blue-900/30" : "bg-blue-50",
      border: isDark ? "border-blue-800" : "border-blue-200",
      textColor: isDark ? "text-blue-300" : "text-blue-800",
      iconColor: isDark ? "text-blue-400" : "text-blue-600",
    },
    anomaly: {
      icon: "⚠️",
      bg: isDark ? "bg-red-900/30" : "bg-red-50",
      border: isDark ? "border-red-800" : "border-red-200",
      textColor: isDark ? "text-red-300" : "text-red-800",
      iconColor: isDark ? "text-red-400" : "text-red-600",
    },
    general: {
      icon: "💡",
      bg: isDark ? "bg-indigo-900/30" : "bg-indigo-50",
      border: isDark ? "border-indigo-800" : "border-indigo-100",
      textColor: isDark ? "text-indigo-300" : "text-indigo-800",
      iconColor: isDark ? "text-indigo-400" : "text-indigo-600",
    },
  };
  const { icon, bg, border, textColor, iconColor } = config[type];
  return (
    <div className={`${bg} border ${border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <span className={`${iconColor} text-xl`}>{icon}</span>
        <p className={`${textColor} text-sm`}>{text}</p>
      </div>
    </div>
  );
};

// Enhanced Data Table with Sorting and Pagination – theme-aware
const DataTableEnhanced = ({
  columns,
  rows,
  isDark,
}: {
  columns: string[];
  rows: any[];
  isDark: boolean;
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const sortedRows = [...rows];
  if (sortColumn) {
    sortedRows.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const headerBg = isDark ? "bg-slate-700" : "bg-slate-50";
  const headerText = isDark ? "text-slate-300" : "text-slate-500";
  const cellText = isDark ? "text-slate-200" : "text-slate-700";
  const tableBorder = isDark ? "border-slate-700" : "border-slate-200";

  return (
    <div
      className={`${cardBg} rounded-2xl shadow-sm border ${border} overflow-hidden`}>
      <div className={`p-5 border-b ${tableBorder}`}>
        <h2
          className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
          <span>📋</span> Data Preview
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className={`${headerBg} sticky top-0`}>
            <tr>
              {columns?.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort(col)}>
                  <div className="flex items-center gap-1">
                    <span className={headerText}>{col}</span>
                    {sortColumn === col &&
                      (sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${cardBg} divide-y ${tableBorder}`}>
            {paginatedRows.map((row, idx) => (
              <tr key={idx}>
                {columns?.map((col) => (
                  <td
                    key={col}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${cellText}`}>
                    {typeof row[col] === "number"
                      ? row[col].toLocaleString()
                      : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          className={`flex justify-between items-center mt-4 px-6 py-3 border-t ${tableBorder}`}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 bg-slate-100 rounded disabled:opacity-50 text-sm">
            Previous
          </button>
          <span
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 bg-slate-100 rounded disabled:opacity-50 text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard Component ---
export default function Home() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [chartView, setChartView] = useState<"consumption" | "cost">(
    "consumption",
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) setCsvText("");
    setData(null);
    setError("");
    setSuccess(false);
  };

  const clearFile = () => {
    setFile(null);
    if (document.querySelector('input[type="file"]') as HTMLInputElement) {
      (document.querySelector('input[type="file"]') as HTMLInputElement).value =
        "";
    }
    setData(null);
    setError("");
    setSuccess(false);
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
    setData(null);
    setError("");
    setSuccess(false);
  };

  const clearCsv = () => {
    setCsvText("");
    setData(null);
    setError("");
    setSuccess(false);
  };

  const uploadFileHandler = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const result = await uploadFile(file);
      setData(result);
      setSuccess(true);
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
    setSuccess(false);
    try {
      const blob = new Blob([csvText], { type: "text/csv" });
      const csvFile = new File([blob], "pasted-data.csv", { type: "text/csv" });
      const result = await uploadFile(csvFile);
      setData(result);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid CSV format.");
    } finally {
      setCsvUploading(false);
    }
  };

  // Load sample data
  const loadSampleData = async () => {
    const sampleCsv = `month,consumption,cost
2023-01,1250,187.5
2023-02,1180,177
2023-03,1320,198
2023-04,1420,213
2023-05,1380,207
2023-06,1290,193.5
2023-07,1350,202.5
2023-08,1480,222
2023-09,1520,228
2023-10,1450,217.5
2023-11,1280,192
2023-12,1360,204`;
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const file = new File([blob], "sample.csv", { type: "text/csv" });
    setFile(file);
    setCsvText("");
    setData(null);
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const result = await uploadFile(file);
      setData(result);
      setSuccess(true);
    } catch (err: any) {
      setError("Failed to load sample data.");
    } finally {
      setLoading(false);
    }
  };

  // Download report
  const downloadReport = () => {
    if (!data?.preview) return;
    const headers = data.columns;
    const rows = data.preview;
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => headers.map((h: string) => row[h]).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "energy_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare chart data
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

  // Bar chart colors
  const getBarColor = (item: any) => {
    if (data?.anomalies?.some((a: any) => a.month === item.month))
      return "#ef4444";
    if (highestMonth && item.month === highestMonth.month) return "#10b981";
    if (lowestMonth && item.month === lowestMonth.month) return "#f59e0b";
    return "#3b82f6";
  };

  // Sparkline data for KPI (last 6 months consumption)
  const sparklineData = monthlyData
    .slice(-6)
    .map((d: any) => ({ value: d.consumption }));

  // Trend calculation (month-over-month for total consumption)
  const trend =
    monthlyData.length > 1
      ? ((monthlyData[monthlyData.length - 1].consumption -
          monthlyData[monthlyData.length - 2].consumption) /
          monthlyData[monthlyData.length - 2].consumption) *
        100
      : undefined;

  // Toggle dark mode class on html element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Preview columns for data table
  const previewColumns =
    data?.preview?.length > 0 ? Object.keys(data.preview[0]) : [];

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-10 shadow-sm ${
          isDark
            ? "bg-slate-900 border-b border-slate-700"
            : "bg-white border-b border-slate-200"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Energy Analytics Dashboard
            </h1>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} mt-1`}>
              Upload your energy consumption data and get instant insights
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleData}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}>
              Sample Data
            </button>
            {data && (
              <button
                onClick={downloadReport}
                className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1 ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}>
                <Download size={14} /> Export
              </button>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-1.5 rounded-lg ${
                isDark
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-100 text-slate-700"
              }`}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
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
          onFileUpload={uploadFileHandler}
          onCsvUpload={uploadPastedCsv}
          isDark={isDark}
        />

        {/* Alerts */}
        {error && <ErrorAlert message={error} />}
        {success && <SuccessAlert message="Data processed successfully!" />}

        {/* Loading Skeletons */}
        {(loading || csvUploading) && !data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <LoadingSkeleton count={3} height="h-28" isDark={isDark} />
            </div>
            <div className="space-y-8 mb-8">
              <LoadingSkeleton count={2} height="h-80" isDark={isDark} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LoadingSkeleton height="h-96" isDark={isDark} />
              </div>
              <div>
                <LoadingSkeleton height="h-96" isDark={isDark} />
              </div>
            </div>
          </>
        )}

        {/* Dashboard Content with Animation */}
        <AnimatePresence mode="wait">
          {!loading && !csvUploading && data ? (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <KPICard
                  title="Total Consumption"
                  value={data.metrics.total_consumption}
                  unit="kWh"
                  icon="⚡"
                  trend={trend}
                  sparklineData={sparklineData}
                  isDark={isDark}
                />
                <KPICard
                  title="Total Cost"
                  value={data.metrics.total_cost}
                  unit="$"
                  icon="💰"
                  isDark={isDark}
                />
                <KPICard
                  title="Avg. Cost per kWh"
                  value={data.metrics.cost_per_kwh.toFixed(2)}
                  unit="$/kWh"
                  icon="📊"
                  isDark={isDark}
                />
              </div>

              {/* Chart Toggle */}
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={() => setChartView("consumption")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    chartView === "consumption"
                      ? isDark
                        ? "bg-indigo-900 text-indigo-300"
                        : "bg-indigo-100 text-indigo-700"
                      : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                  Consumption
                </button>
                <button
                  onClick={() => setChartView("cost")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    chartView === "cost"
                      ? isDark
                        ? "bg-indigo-900 text-indigo-300"
                        : "bg-indigo-100 text-indigo-700"
                      : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                  Cost
                </button>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Line Chart */}
                <div
                  className={`${
                    isDark
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  } rounded-2xl shadow-sm border p-5 hover:shadow-lg transition-shadow`}>
                  <h2
                    className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"} mb-4 flex items-center gap-2`}>
                    <span>📈</span> Monthly Consumption (with anomalies)
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="displayMonth"
                          tick={{
                            fontSize: 12,
                            fill: isDark ? "#94a3b8" : "#475569",
                          }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 12,
                            fill: isDark ? "#94a3b8" : "#475569",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div
                                  className={`p-2 border rounded shadow ${isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-800 border-slate-200"}`}>
                                  <p className="font-bold">{label}</p>
                                  <p>
                                    Consumption:{" "}
                                    {item.consumption.toLocaleString()} kWh
                                  </p>
                                  <p>Cost: ${item.cost.toLocaleString()}</p>
                                  {item.growth_pct && (
                                    <p>Growth: {item.growth_pct.toFixed(1)}%</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="consumption"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                          activeDot={{ r: 6 }}
                          animationDuration={500}
                        />
                        <Scatter
                          data={anomalyPoints}
                          dataKey="consumption"
                          fill="#ef4444"
                          shape="circle">
                          <ZAxis type="number" range={[80, 80]} />
                        </Scatter>
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
                  <div className="flex flex-wrap gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>{" "}
                      Anomaly
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>{" "}
                      Highest consumption
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-orange-500 rounded-full"></span>{" "}
                      Lowest consumption
                    </span>
                  </div>
                </div>

                {/* Bar Chart */}
                <div
                  className={`${
                    isDark
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  } rounded-2xl shadow-sm border p-5 hover:shadow-lg transition-shadow`}>
                  <h2
                    className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"} mb-4 flex items-center gap-2`}>
                    <span>💵</span> Monthly{" "}
                    {chartView === "consumption" ? "Consumption" : "Cost"}
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartView === "consumption" ? (
                        <BarChart data={monthlyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="displayMonth"
                            tick={{
                              fontSize: 12,
                              fill: isDark ? "#94a3b8" : "#475569",
                            }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 12,
                              fill: isDark ? "#94a3b8" : "#475569",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div
                                    className={`p-2 border rounded shadow ${isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-800 border-slate-200"}`}>
                                    <p className="font-bold">
                                      {item.displayMonth}
                                    </p>
                                    <p>
                                      Consumption:{" "}
                                      {item.consumption.toLocaleString()} kWh
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="consumption" animationDuration={500}>
                            {monthlyData.map((entry: any, idx: number) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={getBarColor(entry)}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart data={monthlyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="displayMonth"
                            tick={{
                              fontSize: 12,
                              fill: isDark ? "#94a3b8" : "#475569",
                            }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 12,
                              fill: isDark ? "#94a3b8" : "#475569",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div
                                    className={`p-2 border rounded shadow ${isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-800 border-slate-200"}`}>
                                    <p className="font-bold">
                                      {item.displayMonth}
                                    </p>
                                    <p>Cost: ${item.cost.toLocaleString()}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="cost"
                            fill="#10b981"
                            animationDuration={500}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Growth Chart (Area) */}
              {data?.monthly?.some((m: any) => m.growth_pct !== undefined) && (
                <div
                  className={`${
                    isDark
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  } rounded-2xl shadow-sm border p-5 mb-8`}>
                  <h2
                    className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"} mb-4 flex items-center gap-2`}>
                    <span>📊</span> Month-over-Month Growth (%)
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient
                            id="growthGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1">
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="displayMonth"
                          tick={{
                            fontSize: 12,
                            fill: isDark ? "#94a3b8" : "#475569",
                          }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 12,
                            fill: isDark ? "#94a3b8" : "#475569",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div
                                  className={`p-2 border rounded shadow ${isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-800 border-slate-200"}`}>
                                  <p className="font-bold">
                                    {item.displayMonth}
                                  </p>
                                  <p>Growth: {item.growth_pct?.toFixed(1)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="growth_pct"
                          stroke="#10b981"
                          fill="url(#growthGradient)"
                          animationDuration={500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Bottom Section: Insights & Data Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights */}
                <div className="lg:col-span-1 space-y-4">
                  <h2
                    className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
                    <span>🧠</span> AI Insights
                  </h2>
                  {data.insights?.map((insight: string, idx: number) => {
                    let type: "trend" | "cost" | "anomaly" | "general" =
                      "general";
                    const lower = insight.toLowerCase();
                    if (
                      lower.includes("trend") ||
                      lower.includes("increase") ||
                      lower.includes("decrease")
                    )
                      type = "trend";
                    else if (
                      lower.includes("cost") ||
                      lower.includes("price") ||
                      lower.includes("expensive")
                    )
                      type = "cost";
                    else if (
                      lower.includes("anomal") ||
                      lower.includes("unusual") ||
                      lower.includes("spike")
                    )
                      type = "anomaly";
                    return (
                      <InsightCard
                        key={idx}
                        type={type}
                        text={insight}
                        isDark={isDark}
                      />
                    );
                  })}
                  {data.anomalies?.length > 0 && (
                    <div
                      className={`${isDark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"} border rounded-xl p-4`}>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-500 text-xl">⚠️</span>
                        <div>
                          <h3
                            className={`font-semibold ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                            Anomalies Detected
                          </h3>
                          <ul
                            className={`mt-2 space-y-1 text-sm ${isDark ? "text-amber-500" : "text-amber-700"}`}>
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
                  <DataTableEnhanced
                    columns={previewColumns}
                    rows={data.preview}
                    isDark={isDark}
                  />
                </div>
              </div>
            </motion.div>
          ) : !loading && !csvUploading && !data && !error ? (
            <EmptyState isDark={isDark} />
          ) : null}
        </AnimatePresence>

        {/* Footer */}
        <footer
          className={`mt-12 text-center text-xs ${isDark ? "text-slate-500 border-slate-700" : "text-slate-400 border-slate-200"} border-t pt-6`}>
          Energy Analytics Dashboard — Powered by AI & Recharts
        </footer>
      </main>
    </div>
  );
}
