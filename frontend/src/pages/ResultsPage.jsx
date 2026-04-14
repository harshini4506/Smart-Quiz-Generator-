import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

export default function ResultsPage({ resultData }) {
  const navigate = useNavigate();
  
  const exportPdf = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(111, 66, 193); // Purple color
    doc.text("Quiz Results", 105, 20, { align: "center" });
    
    // Score
    doc.setFontSize(40);
    const scorePercentage = resultData.score || 0;
    const scoreColor = scorePercentage >= 80 ? [34, 197, 94] : scorePercentage >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(...scoreColor);
    doc.text(`${scorePercentage}%`, 105, 45, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Your Score", 105, 55, { align: "center" });
    
    // Correct & Wrong Answers
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Correct Answers: ${resultData.correct_answers || 0}`, 20, 75);
    doc.text(`Wrong Answers: ${resultData.wrong_answers || 0}`, 120, 75);
    
    // Feedback
    doc.setFontSize(16);
    doc.setTextColor(111, 66, 193);
    doc.text("Feedback", 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const feedbackLines = doc.splitTextToSize(resultData.feedback || "No feedback available", 170);
    doc.text(feedbackLines, 20, 105);
    
    let yPosition = 105 + (feedbackLines.length * 7);
    
    // Suggestions
    if (resultData.suggestions) {
      doc.setFontSize(16);
      doc.setTextColor(111, 66, 193);
      doc.text("Suggestions", 20, yPosition + 10);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const suggestionLines = doc.splitTextToSize(resultData.suggestions, 170);
      doc.text(suggestionLines, 20, yPosition + 20);
      yPosition += 20 + (suggestionLines.length * 7);
    }
    
    // Weak Topics
    if (resultData.mistake_topics && resultData.mistake_topics.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(111, 66, 193);
      doc.text("Areas to Improve", 20, yPosition + 10);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      resultData.mistake_topics.forEach((topic, idx) => {
        doc.text(`• ${topic}`, 25, yPosition + 22 + (idx * 7));
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 285, { align: "center" });
    
    doc.save("quiz-result.pdf");
  };

  if (!resultData) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-700">No result yet. Take a quiz first!</p>
            <button 
              onClick={() => navigate('/quiz')} 
              className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Go to Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scorePercentage = resultData.score || 0;
  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-400';
    if (scorePercentage >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreEmoji = () => {
    if (scorePercentage >= 80) return '🎉';
    if (scorePercentage >= 50) return '👍';
    return '📚';
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{getScoreEmoji()}</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Results</h1>
            <div className="mt-4">
              <span className="text-3xl">⭐</span>
            </div>
          </div>

          <div className="mb-8 text-center">
            <div className={`text-7xl font-bold mb-2 ${getScoreColor()}`}>
              {scorePercentage}%
            </div>
            <p className="text-xl text-gray-600">Your Score</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">{resultData.correct_answers || 0}</div>
              <p className="text-gray-700 font-semibold">Correct Answers</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-red-700 mb-2">{resultData.wrong_answers || 0}</div>
              <p className="text-gray-700 font-semibold">Wrong Answers</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Feedback</h2>
            <p className="text-lg text-gray-700 mb-4">{resultData.feedback}</p>
            {resultData.suggestions && (
              <p className="text-gray-600">{resultData.suggestions}</p>
            )}
          </div>

          {resultData.mistake_topics && resultData.mistake_topics.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-200">
              <h2 className="text-xl font-bold text-amber-800 mb-3">Areas to Improve</h2>
              <div className="flex flex-wrap gap-2">
                {resultData.mistake_topics.map((topic, idx) => (
                  <span key={idx} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-semibold border border-amber-300">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={exportPdf} 
              className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Download PDF
            </button>
            <button 
              onClick={() => navigate('/quiz')} 
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Take Another Quiz
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
