import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

import api from "../services/api";
import { useAppContext } from "../context/AppContext";

export default function SummaryPage({ selectedDocId }) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(selectedDocId);
  const { dispatch } = useAppContext();

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const { data } = await api.get("/history");
        setDocs(data.files || []);
      } catch (_err) {
        // Silent fail
      }
    };
    loadDocs();
    setCurrentDocId(selectedDocId);
  }, [selectedDocId]);

  const handleDocChange = (docId) => {
    setCurrentDocId(docId);
    dispatch({ type: "SET_SELECTED_DOC", payload: docId });
  };

  const fetchSummary = async () => {
    if (!currentDocId) {
      setStatus("Upload/select a document first.");
      return;
    }
    setStatus("Generating comprehensive summary...");
    try {
      const { data } = await api.get(`/summary?doc_id=${currentDocId}`);
      setSummary(data);
      setStatus("Summary ready.");
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to summarize");
    }
  };

  const downloadPDF = () => {
    if (!summary) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(111, 66, 193); // Purple
    doc.text("COMPREHENSIVE STUDY SUMMARY", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Topic-Wise Summary", margin, yPosition);
    yPosition += 10;

    // Parse and add summary content
    doc.setFontSize(10);
    const summaryLines = summary.summary.split('\n');
    for (let line of summaryLines) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      // Check if it's a topic heading (contains **)
      if (line.includes('**')) {
        const topicText = line.replace(/\*\*/g, '').trim();
        if (topicText) {
          doc.setFontSize(12);
          doc.setTextColor(111, 66, 193);
          const wrappedTopic = doc.splitTextToSize(topicText, maxWidth);
          doc.text(wrappedTopic, margin, yPosition);
          yPosition += wrappedTopic.length * 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        }
      } else if (line.trim()) {
        const wrappedText = doc.splitTextToSize(line.trim(), maxWidth);
        doc.text(wrappedText, margin, yPosition);
        yPosition += wrappedText.length * 6;
      }
      yPosition += 3;
    }

    // Key Points Section
    yPosition += 10;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(34, 139, 34); // Green
    doc.text("Key Points to Remember", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    (summary.key_points || []).forEach((point, index) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }
      const pointText = `${index + 1}. ${point}`;
      const wrappedPoint = doc.splitTextToSize(pointText, maxWidth - 5);
      doc.text(wrappedPoint, margin + 5, yPosition);
      yPosition += wrappedPoint.length * 6 + 4;
    });

    // Important Topics Section
    yPosition += 10;
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(30, 144, 255); // Blue
    doc.text("Important Topics", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const topicsText = (summary.important_topics || []).join(' • ');
    const wrappedTopics = doc.splitTextToSize(topicsText, maxWidth);
    doc.text(wrappedTopics, margin, yPosition);

    // Footer
    const now = new Date();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save("study-summary.pdf");
  };

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 lg:p-10 border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className="text-5xl sm:text-6xl mb-4">📄</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Comprehensive Document Summary</h1>
            <p className="text-gray-600 text-base sm:text-lg">Get detailed, topic-wise AI-powered summary for exam preparation</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="text-3xl">⭐</span>
              <span className="text-3xl">✨</span>
              <span className="text-3xl">📚</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">📄 Select Document</label>
            <select 
              value={currentDocId} 
              onChange={(e) => handleDocChange(e.target.value)} 
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-base sm:text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Choose a document...</option>
              {docs.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.filename}</option>
              ))}
            </select>
            {!currentDocId && <p className="text-sm text-red-600 mt-2">⚠️ Upload a document first</p>}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchSummary} 
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 sm:py-5 text-base sm:text-xl font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all mb-6 shadow-lg"
          >
            🚀 Generate Comprehensive Summary
          </motion.button>

          {status && (
            <p className={`text-center p-4 rounded-lg font-semibold mb-6 ${status.includes('Upload') || status.includes('Failed') ? 'text-red-700 bg-red-50' : status.includes('ready') ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
              {status}
            </p>
          )}

          {summary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Main Comprehensive Summary */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border-2 border-purple-300 shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-6 flex items-center gap-3 border-b-2 border-purple-200 pb-3">
                  📚 Comprehensive Topic-Wise Summary
                </h2>
                <div className="text-gray-800 leading-relaxed space-y-4">
                  {summary.summary.split('\n').map((paragraph, i) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;

                    // Check if it's a topic heading (contains **)
                    if (trimmed.includes('**')) {
                      // Extract topic name from between **
                      const matches = trimmed.match(/\*\*(.+?)\*\*/);
                      if (matches) {
                        const topicName = matches[1];
                        const remainingText = trimmed.replace(/\*\*.+?\*\*/, '').trim();
                        
                        return (
                          <div key={i} className="mt-6 first:mt-0 bg-purple-50 rounded-xl p-5 border-l-4 border-purple-500">
                            <h3 className="font-bold text-purple-900 text-lg sm:text-xl mb-3 flex items-center gap-2">
                              <span className="text-2xl">📖</span>
                              {topicName}
                            </h3>
                            {remainingText && (
                              <p className="text-gray-700 text-sm sm:text-base leading-relaxed ml-0 sm:ml-8">
                                {remainingText}
                              </p>
                            )}
                          </div>
                        );
                      }
                    }
                    
                    // Regular paragraph
                    return trimmed.length > 20 ? (
                      <p key={i} className="text-gray-700 text-sm sm:text-base leading-relaxed ml-0 sm:ml-8">
                        {trimmed}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Key Points Section */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border-2 border-green-300 shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-green-900 mb-6 flex items-center gap-3 border-b-2 border-green-200 pb-3">
                  ✅ Key Points to Remember ({summary.key_points?.length || 0})
                </h2>
                <div className="grid gap-4">
                  {(summary.key_points || []).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 bg-green-50 p-4 rounded-xl border-l-4 border-green-500 hover:shadow-md transition-shadow"
                    >
                      <span className="bg-green-600 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-800 text-sm sm:text-base leading-relaxed flex-1">
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Important Topics Tags */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border-2 border-blue-300 shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 flex items-center gap-3 border-b-2 border-blue-200 pb-3">
                  🎯 Important Topics ({summary.important_topics?.length || 0})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {(summary.important_topics || []).map((item, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-default"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Download PDF Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadPDF}
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-xl font-bold text-white shadow-2xl hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">📄</span>
                Download Complete Summary as PDF
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
