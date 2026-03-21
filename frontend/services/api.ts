// services/api.ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE}/upload`, formData);
  return response.data;
};
