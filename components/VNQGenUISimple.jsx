"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, BookOpenCheck, ListChecks, FileQuestion, Settings, Bot, Loader, Download } from "lucide-react";
import { motion } from "framer-motion";
import { analyzeTextWithAPI, summarizeTextWithAPI, generateQuestionsWithAPI } from "@/lib/gemini";

export default function VNQGenUISimple() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [textInput, setTextInput] = useState(
    "Việt Nam giành độc lập ngày 2/9/1945. Sự kiện diễn ra tại Quảng trường Ba Đình. Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập."
  );
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [config, setConfig] = useState({
    extractionRatio: 20,
    summaryLength: 75,
    numQuestions: 4,
    questionTypes: "all",
    enableChunking: true
  });

  // Hàm xử lý khi thay đổi cấu hình
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Phân tích văn bản với API
  const analyzeText = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Phân tích văn bản
      const analysis = await analyzeTextWithAPI(textInput, config.extractionRatio);
      setAnalysisData(analysis);
      setActiveTab("analysis");
      
      // Step 2: Tạo tóm tắt
      const summary = await summarizeTextWithAPI(textInput, config.summaryLength);
      setSummaryData(summary);
      
      // Step 3: Tạo câu hỏi
      const questions = await generateQuestionsWithAPI(
        textInput, 
        config.numQuestions, 
        config.questionTypes
      );
      setQuestionsData(questions);
      
    } catch (err) {
      console.error("Lỗi khi xử lý văn bản:", err);
      setError("Có lỗi xảy ra khi xử lý văn bản. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm tải xuống câu hỏi dưới dạng file
  const downloadQuestions = () => {
    if (!questionsData) return;
    
    // Định dạng câu hỏi thành văn bản
    let content = "CÂU HỎI TRẮC NGHIỆM\n\n";
    
    questionsData.forEach((q, index) => {
      content += `${index + 1}. ${q.question}\n`;
      
      if (q.type === "mcq") {
        q.answers.forEach((answer, i) => {
          const prefix = String.fromCharCode(65 + i); // A, B, C, D
          content += `   ${prefix}. ${answer}${i === q.correct_index ? ' ✓' : ''}\n`;
        });
      } else if (q.type === "tf") {
        content += `   Đáp án: ${q.answer ? 'Đúng' : 'Sai'}\n`;
      } else if (q.type === "fill") {
        content += `   Đáp án: ${q.answer}\n`;
      }
      
      content += "\n";
    });
    
    // Tạo file và tải xuống
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cau-hoi-trac-nghiem.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSidebar = () => (
    <div className="lg:col-span-1 hidden lg:block bg-white rounded-2xl p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-4">VN-Summarizer-QGen</h2>
      <ul className="space-y-2">
        <li onClick={() => setActiveTab("input")} className={`cursor-pointer flex items-center gap-2 font-medium ${activeTab === "input" ? "text-blue-600" : "text-gray-700"}`}>
          <FileText size={18} /> Nhập văn bản
        </li>
        <li onClick={() => setActiveTab("analysis")} className={`cursor-pointer flex items-center gap-2 font-medium ${activeTab === "analysis" ? "text-blue-600" : "text-gray-700"}`}>
          <BookOpenCheck size={18} /> Phân tích văn bản
        </li>
        <li onClick={() => setActiveTab("summary")} className={`cursor-pointer flex items-center gap-2 font-medium ${activeTab === "summary" ? "text-blue-600" : "text-gray-700"}`}>
          <ListChecks size={18} /> Tóm tắt
        </li>
        <li onClick={() => setActiveTab("questions")} className={`cursor-pointer flex items-center gap-2 font-medium ${activeTab === "questions" ? "text-blue-600" : "text-gray-700"}`}>
          <FileQuestion size={18} /> Tạo câu hỏi
        </li>
        <li onClick={() => setActiveTab("settings")} className={`cursor-pointer flex items-center gap-2 font-medium ${activeTab === "settings" ? "text-blue-600" : "text-gray-700"}`}>
          <Settings size={18} /> Cấu hình
        </li>
      </ul>
    </div>
  );

  const renderAnalysis = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Phân tích TextRank</h3>
        {error && <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>}
        {loading && !analysisData ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {analysisData && (
              <>
                <div>
                  <h4 className="text-sm font-medium">Từ khóa quan trọng:</h4>
                  {analysisData.keywords && Array.isArray(analysisData.keywords) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysisData.keywords.map((keyword, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {typeof keyword === 'string' ? keyword : JSON.stringify(keyword)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium">Câu quan trọng (top {config.extractionRatio}%):</h4>
                  {analysisData.important_sentences && Array.isArray(analysisData.important_sentences) && (
                      <>
                        {analysisData.important_sentences.map((sentence, i) => (
                          <p key={i} className="bg-yellow-50 p-2 rounded-md text-sm mt-1 border-l-2 border-yellow-400">
                            {typeof sentence === 'string' ? sentence : JSON.stringify(sentence)}
                          </p>
                        ))}
                      </>
                    )}
                </div>
                {analysisData.entities && (
                  <div>
                    <h4 className="text-sm font-medium">Thực thể được nhận diện:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysisData.entities.map((entity, i) => (
                        <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {typeof entity === 'string' 
                            ? entity 
                            : (entity.entity || entity.name || JSON.stringify(entity))}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSummary = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Kết quả tóm tắt:</h3>
        {error && <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>}
        {loading && !summaryData ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <>
            {summaryData && (
              <>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-800">{summaryData.enhanced_summary}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                    <span>ROUGE-1: {summaryData.rouge_score.toFixed(2)}</span>
                    <span>Độ dài: {summaryData.summary_length} từ</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium">So sánh với mô hình cơ bản:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Base:</div>
                      <p className="text-sm">{summaryData.base_summary}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-500 mb-1">Enhanced:</div>
                      <p className="text-sm">{summaryData.enhanced_summary}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderQuestions = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Câu hỏi trắc nghiệm:</h3>
        {error && <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>}
        {loading && !questionsData ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <>
            {questionsData && (
              <>
                <div className="space-y-4">
                  {questionsData.map((q, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-3 shadow-sm">
                      <p className="font-medium">{index + 1}. {q.question}</p>
                      <div className="mt-2">
                        {q.type === "mcq" && (
                          <ul className="pl-6 text-sm text-gray-700 space-y-1">
                            {q.answers.map((a, i) => (
                              <li key={i} className={`${i === q.correct_index ? "bg-green-100 px-2 py-1 rounded-md flex items-center gap-2" : ""}`}>
                                {i === q.correct_index ? "✅ " : ""}{a}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.type === "tf" && (
                          <div className="pl-6 text-sm">
                            <span className={q.answer ? "bg-green-100 px-2 py-1 rounded-md" : ""}>
                              {q.answer ? "✅ Đúng" : "Đúng"}
                            </span>
                            <span className="mx-4">|</span>
                            <span className={!q.answer ? "bg-green-100 px-2 py-1 rounded-md" : ""}>
                              {!q.answer ? "✅ Sai" : "Sai"}
                            </span>
                          </div>
                        )}
                        {q.type === "fill" && (
                          <div className="pl-6 text-sm">
                            <span className="bg-green-100 px-2 py-1 rounded-md">✅ {q.answer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <Button variant="outline" className="border-blue-600 text-blue-600" onClick={downloadQuestions}>
                    Tải về <Download className="ml-2" size={16} />
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSettings = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Cấu hình mô hình</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tỷ lệ trích xuất câu (%)</label>
            <Input 
              type="number" 
              value={config.extractionRatio} 
              onChange={(e) => handleConfigChange('extractionRatio', parseInt(e.target.value))}
              min={5} 
              max={50} 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Độ dài tóm tắt (từ)</label>
            <Input 
              type="number" 
              value={config.summaryLength} 
              onChange={(e) => handleConfigChange('summaryLength', parseInt(e.target.value))}
              min={30} 
              max={150} 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Số lượng câu hỏi</label>
            <Input 
              type="number" 
              value={config.numQuestions} 
              onChange={(e) => handleConfigChange('numQuestions', parseInt(e.target.value))}
              min={1} 
              max={10} 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Loại câu hỏi</label>
            <select 
              className="w-full p-2 border rounded"
              value={config.questionTypes}
              onChange={(e) => handleConfigChange('questionTypes', e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="mcq">Trắc nghiệm (MCQ)</option>
              <option value="tf">Đúng/Sai</option>
              <option value="fill">Điền khuyết</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={config.enableChunking}
                onChange={(e) => handleConfigChange('enableChunking', e.target.checked)}
              />
              <span className="text-sm font-medium">Bật chunking cho văn bản dài</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 min-h-screen bg-gray-100 p-4 gap-4">
      {renderSidebar()}

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "input" && (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung bài học tại đây..."
                  rows={10}
                  className="resize-none"
                />
                <div className="mt-4 text-right">
                  <Button 
                    className="bg-blue-600 text-white" 
                    disabled={loading}
                    onClick={analyzeText}
                  >
                    {loading ? <Loader className="animate-spin mr-2" size={16} /> : <Bot className="mr-2" size={16} />}
                    {loading ? "Đang xử lý..." : "Phân tích"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "analysis" && renderAnalysis()}
          
          {activeTab === "summary" && renderSummary()}

          {activeTab === "questions" && renderQuestions()}
          
          {activeTab === "settings" && renderSettings()}
        </motion.div>
      </div>
    </div>
  );
}