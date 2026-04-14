import React, { useState } from "react";
import { motion } from "framer-motion";

import api from "../services/api";
import { useAppContext } from "../context/AppContext";

export default function UploadPage({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const { dispatch } = useAppContext();

  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setStatus("Uploading...");
    try {
      const { data } = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("Upload complete and indexed.");
      dispatch({ type: "SET_SELECTED_DOC", payload: data.file_id });
      onUploaded(data.file_id, file.name, data.keywords || []);
    } catch (err) {
      if (!err?.response) {
        setStatus("Cannot reach server. Start backend and try again.");
      } else if (err?.response?.status === 401) {
        setStatus("Session expired or missing. Please login again.");
      } else {
        setStatus(err?.response?.data?.error || "Upload failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Upload Study Material</h1>
            <p className="text-gray-600">Supported formats: PDF, DOCX, TXT, PPTX</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="text-3xl">⭐</span>
              <span className="text-3xl">✨</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3 text-lg">Select File</label>
              <input 
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white file:font-semibold hover:file:from-blue-600 hover:file:to-blue-700 cursor-pointer placeholder-gray-400" 
                type="file" 
                accept=".pdf,.docx,.txt,.pptx"
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
              )}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={upload} 
              disabled={!file}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-lg font-bold text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              Upload File
            </motion.button>

            {status && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center p-4 rounded-lg font-semibold ${status.includes('complete') ? 'text-green-700 bg-green-50 border border-green-200' : status.includes('failed') ? 'text-red-700 bg-red-50 border border-red-200' : 'text-blue-700 bg-blue-50 border border-blue-200'}`}
              >
                {status}
                {status.includes('complete') && (
                  <p className="text-sm mt-2 text-green-600">✅ Document is now selected for Quiz, Summary & Chatbot!</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
