"use client";

import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://127.0.0.1:8000/upload", formData);

      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Energy Analytics Dashboard</h1>

      <div className="border p-4 rounded-lg">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 mt-4 rounded">
          {loading ? "Uploading..." : "Upload"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      {data?.metrics && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="text-sm">Total Consumption</h3>
            <p className="text-xl font-bold">
              {data.metrics.total_consumption} kWh
            </p>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="text-sm">Total Cost</h3>
            <p className="text-xl font-bold">${data.metrics.total_cost}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="text-sm">Cost per kWh</h3>
            <p className="text-xl font-bold">
              ${data.metrics.cost_per_kwh.toFixed(2)}
            </p>
          </div>
        </div>
      )}
      {data && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Preview Data</h2>

          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data.preview, null, 2)}
          </pre>

          <h2 className="text-xl font-semibold mt-6 mb-2">Columns</h2>

          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(data.columns, null, 2)}
          </pre>
        </div>
      )}

      {data?.monthly && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Monthly Consumption</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="consumption" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {data?.monthly && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Monthly Cost</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {data?.insights && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Insights</h2>

          <ul className="list-disc pl-5">
            {data.insights.map((insight: string, index: number) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
      {data?.anomalies && data.anomalies.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Anomalies Detected</h2>

          <ul className="list-disc pl-5 text-red-600">
            {data.anomalies.map((a: any, index: number) => (
              <li key={index}>
                {a.month}: {a.consumption} kWh (z-score: {a.z_score.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
