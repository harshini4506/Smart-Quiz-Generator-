import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import api from "../services/api";
import { useAppContext } from "../context/AppContext";

export default function ChatbotPage({ selectedDocId }) {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(selectedDocId);
  const { dispatch } = useAppContext();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  const exampleQuestions = [
    "What is thermal pollution?",
    "Explain the main concept of this document",
    "What are the key points discussed?",
    "List the important topics covered"
  ];

  const ask = async () => {
    if (!currentDocId) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        message: '⚠️ Please upload and select a document first!'
      }]);
      return;
    }
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setIsLoading(true);

    // Add user question to chat
    setChatHistory(prev => [...prev, {
      type: 'question',
      message: currentQuestion
    }]);

    try {
      const { data } = await api.post("/chat", { doc_id: currentDocId, question: currentQuestion });
      
      // Add AI answer to chat
      setChatHistory(prev => [...prev, {
        type: 'answer',
        message: data.answer
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        message: err?.response?.data?.error || '❌ Failed to get answer. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuestion(example);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading]);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Study Assistant</h1>
            <p className="text-gray-600 text-lg">Ask questions and get instant answers from your documents</p>
            <div className="mt-4 flex justify-center gap-3">
              <span className="text-3xl animate-pulse">⭐</span>
              <span className="text-3xl animate-bounce">✨</span>
              <span className="text-3xl animate-pulse">🎓</span>
            </div>
          </div>

          {/* Chat Container */}
          <div className="p-6 bg-white">
            {/* Document Selector */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-gray-700 font-semibold mb-3">📄 Select Document</label>
              <select 
                value={currentDocId} 
                onChange={(e) => handleDocChange(e.target.value)} 
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">Choose a document...</option>
                {docs.map((doc) => (
                  <option key={doc._id} value={doc._id}>{doc.filename}</option>
                ))}
              </select>
              {!currentDocId && <p className="text-sm text-red-600 mt-2">⚠️ Upload a document first</p>}
            </div>

            {/* Example Questions */}
            {chatHistory.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <p className="text-gray-600 text-sm font-semibold mb-3 text-center">💡 Try these example questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exampleQuestions.map((example, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExampleClick(example)}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-left px-4 py-3 rounded-xl text-sm transition-all border border-gray-200"
                    >
                      <span className="mr-2">🔹</span>{example}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat History */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {chatHistory.map((chat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: chat.type === 'question' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${chat.type === 'question' ? 'justify-end' : 'justify-start'}`}
                  >
                    {chat.type === 'question' && (
                      <div className="bg-blue-500 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-md shadow-lg">
                        <p className="text-sm font-semibold mb-1">You</p>
                        <p className="leading-relaxed">{chat.message}</p>
                      </div>
                    )}
                    
                    {chat.type === 'answer' && (
                      <div className="bg-white text-gray-800 px-5 py-4 rounded-2xl rounded-tl-sm max-w-2xl shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🤖</span>
                          <p className="text-sm font-bold text-blue-700">AI Assistant</p>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{chat.message}</p>
                      </div>
                    )}
                    
                    {chat.type === 'error' && (
                      <div className="bg-red-100 text-red-800 px-5 py-3 rounded-2xl max-w-md shadow-lg border-2 border-red-300">
                        <p className="leading-relaxed">{chat.message}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white text-gray-800 px-5 py-4 rounded-2xl rounded-tl-sm shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              {chatHistory.length > 0 && (
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearChat}
                    className="text-gray-600 hover:text-gray-800 text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    🗑️ Clear Chat
                  </motion.button>
                </div>
              )}
              
              <div className="flex gap-3">
                <input 
                  ref={inputRef}
                  className="flex-1 rounded-2xl border-2 border-gray-300 bg-white p-4 text-gray-900 text-lg focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all placeholder-gray-400" 
                  value={question} 
                  onChange={(e) => setQuestion(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && ask()}
                  placeholder="Type your question here..." 
                  disabled={isLoading}
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={ask} 
                  disabled={isLoading}
                  className={`rounded-2xl px-8 py-4 text-lg font-bold text-white transition-all shadow-lg ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isLoading ? '⏳' : '🚀'} Ask
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-gray-600 text-sm"
        >
          <p>💡 <strong>Pro Tip:</strong> Ask specific questions for better answers. The AI analyzes your uploaded document to provide relevant information!</p>
        </motion.div>
      </div>
    </div>
  );
}
