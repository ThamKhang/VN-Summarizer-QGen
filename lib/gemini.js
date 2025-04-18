import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo API với key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Hàm xử lý response để lấy text an toàn từ API Gemini
const getTextFromResponse = (response) => {
    try {
      console.log("Raw API response:", JSON.stringify(response, null, 2));
      
      // Truy cập trực tiếp vào nội dung
      const candidates = response.candidates || [];
      if (candidates.length > 0) {
        const content = candidates[0].content || {};
        const parts = content.parts || [];
        
        if (parts.length > 0) {
          // Kiểm tra nếu text là object
          if (typeof parts[0] === 'object') {
            if (parts[0].text) {
              return parts[0].text;
            } else {
              // Chuyển đổi object thành string JSON
              return JSON.stringify(parts[0]);
            }
          }
          return parts[0] || "";
        }
      }
      
      // Fallback: convert toàn bộ response thành string
      return JSON.stringify(response);
    } catch (err) {
      console.error("Lỗi khi trích xuất text từ response:", err);
      return "";
    }
  };

// Hàm parse JSON an toàn - cải tiến
const safeParseJSON = (text) => {
    try {
      // Làm sạch text khỏi các ký tự lạ và markdown
      const cleanedText = text
        .replace(/```json|```/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .trim();
  
      // Cắt đoạn từ dấu { đến dấu } cuối cùng
      const start = cleanedText.indexOf('{');
      const end = cleanedText.lastIndexOf('}');
      
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = cleanedText.slice(start, end + 1);

        // Đảm bảo không còn ký tự dư thừa sau JSON
        const isPureJSON = jsonStr.trim().match(/^[{\[].*[}\]]$/s);
        if (isPureJSON) {
          try {
            return JSON.parse(cleanedText);  // Nếu đúng JSON, cố gắng parse
          } catch (err) {
            console.error('Lỗi khi parse JSON object:', err);
          }
        }
      }
  
      // Nếu không phải object, thử parse mảng
      const match = cleanedText.match(/({[\s\S]*}|\[[\s\S]*\])/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
  
      // Thử parse toàn bộ (nếu là dạng đơn giản)
      return JSON.parse(cleanedText);
  
    } catch (err) {
      console.error("Lỗi parse JSON:", err);
      console.log("Text gốc:", text);
  
      // fallback các tình huống đặc biệt
      try {
        if (text.includes('"question"') && text.includes('"type"')) {
          const objects = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
          return objects.map(obj => {
            try {
              return JSON.parse(obj);
            } catch {
              return {
                question: "Không thể parse câu hỏi",
                type: "mcq",
                answers: ["A", "B", "C"],
                correct_index: 0,
              };
            }
          });
        } else if (text.includes('keywords') || text.includes('important_sentences')) {
          return {
            keywords: ["Không thể phân tích văn bản"],
            important_sentences: ["Không thể trích xuất câu quan trọng từ dữ liệu API."],
            entities: ["Không thể nhận diện thực thể"]
          };
        } else if (text.includes('summary') || text.includes('enhanced_summary')) {
          return {
            base_summary: "Không thể tạo tóm tắt.",
            enhanced_summary: "API không thể tạo tóm tắt cho văn bản này.",
            summary_length: 0,
            rouge_score: 0
          };
        }
  
        return null;
      } catch (finalErr) {
        console.error("Không thể xử lý JSON:", finalErr);
        return null;
      }
    }
  };
  

const callGeminiAPI = async (prompt, modelName = "gemini-2.0-flash", maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Set timeout cho API call
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("API timeout")), 30000)
        );
        
        // API call
        const model = genAI.getGenerativeModel({ model: modelName });
        const generatePromise = model.generateContent(prompt);
        
        // Race giữa API call và timeout
        const result = await Promise.race([generatePromise, timeoutPromise]);
        const textContent = getTextFromResponse(result.response);
        
        console.log("API response text:", textContent);
        
        if (!textContent) {
          throw new Error("Response empty");
        }
        
        return textContent;
      } catch (err) {
        retries++;
        console.error(`API call failed (attempt ${retries}/${maxRetries}):`, err);
        
        // Nếu lỗi là rate limit (429), đợi lâu hơn
        if (err.toString().includes('429')) {
          console.log("Rate limit exceeded, waiting 60 seconds before retry...");
          await new Promise(r => setTimeout(r, 60000)); // Đợi 60 giây
        } else if (retries >= maxRetries) {
          throw err;
        } else {
          // Exponential backoff thông thường cho các lỗi khác
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        }
      }
    }
  };

// Các hàm chính để gọi API cho từng chức năng
export const analyzeTextWithAPI = async (text, extractionRatio = 20) => {
  try {
    const prompt = `
    Phân tích văn bản tiếng Việt sau đây:
    "${text}"
    
    Trả về kết quả dưới dạng JSON với cấu trúc:
    {
      "keywords": [danh sách các từ khóa quan trọng],
      "important_sentences": [danh sách các câu quan trọng nhất, chiếm khoảng ${extractionRatio}% tổng số câu],
      "entities": [danh sách các thực thể được nhận diện]
    }
    
    Chỉ trả về JSON, không có text giải thích.
    `;
    
    const response = await callGeminiAPI(prompt);
    const parsedData = safeParseJSON(response);
    
    // Fallback nếu parse thất bại
    if (!parsedData) {
      return {
        keywords: ["API error"],
        important_sentences: ["Không thể phân tích văn bản."],
        entities: []
      };
    }
    
    return parsedData;
  } catch (err) {
    console.error("Error in analyzeTextWithAPI:", err);
    throw err;
  }
};

export const summarizeTextWithAPI = async (text, summaryLength = 75) => {
  try {
    const prompt = `
    Tóm tắt văn bản tiếng Việt sau đây thành khoảng ${summaryLength} từ:
    "${text}"
    
    Trả về kết quả dưới dạng JSON với cấu trúc:
    {
      "base_summary": "tóm tắt ngắn gọn, cơ bản",
      "enhanced_summary": "tóm tắt chi tiết hơn, đầy đủ thông tin quan trọng",
      "summary_length": số từ trong enhanced_summary,
      "rouge_score": điểm đánh giá chất lượng tóm tắt (0.0-1.0)
    }
    
    Chỉ trả về JSON, không có text giải thích.
    `;
    
    const response = await callGeminiAPI(prompt);
    const parsedData = safeParseJSON(response);
    
    // Fallback nếu parse thất bại
    if (!parsedData) {
      return {
        base_summary: "Không thể tạo tóm tắt.",
        enhanced_summary: "API không thể tạo tóm tắt cho văn bản này.",
        summary_length: 0,
        rouge_score: 0
      };
    }
    
    return parsedData;
  } catch (err) {
    console.error("Error in summarizeTextWithAPI:", err);
    throw err;
  }
};

export const generateQuestionsWithAPI = async (text, numQuestions = 4, questionTypes = "all") => {
  try {
    const prompt = `
    Tạo ${numQuestions} câu hỏi trắc nghiệm từ văn bản tiếng Việt sau đây:
    "${text}"
    
    Loại câu hỏi: ${questionTypes === "all" ? "trắc nghiệm (mcq), đúng/sai (tf), và điền khuyết (fill)" : questionTypes}
    
    Trả về kết quả dưới dạng JSON với cấu trúc mảng các câu hỏi:
    [
      {
        "question": "nội dung câu hỏi",
        "type": "mcq/tf/fill",
        "answers": ["lựa chọn A", "lựa chọn B", "lựa chọn C"] (chỉ cho mcq),
        "correct_index": chỉ số đáp án đúng (chỉ cho mcq),
        "answer": giá trị đúng/sai hoặc câu trả lời (cho tf và fill)
      },
      ...
    ]
    
    Chỉ trả về JSON, không có text giải thích.
    `;
    
    const response = await callGeminiAPI(prompt);
    const parsedData = safeParseJSON(response);
    
    // Fallback nếu parse thất bại
    if (!parsedData) {
      return [
        {
          question: "Không thể tạo câu hỏi từ API.",
          type: "mcq",
          answers: ["Error", "API failed", "Try again"],
          correct_index: 0
        }
      ];
    }
    
    return parsedData;
  } catch (err) {
    console.error("Error in generateQuestionsWithAPI:", err);
    throw err;
  }
};