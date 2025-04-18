# VN-Summarizer-QGen

Ứng dụng tóm tắt văn bản tiếng Việt và tạo câu hỏi tự động bằng AI.


## ✨ Tính năng chính

- **Phân tích văn bản**: Trích xuất từ khóa và câu quan trọng sử dụng thuật toán TextRank.
    - ![image](https://github.com/user-attachments/assets/16434491-6b51-400b-b2c9-717cc92e2636)
- **Tóm tắt thông minh**: Tạo tóm tắt ngắn gọn, tự nhiên, giữ nguyên ý chính.
    - ![image](https://github.com/user-attachments/assets/ae54f54b-9cef-4121-a45d-45214f568c61)

- **Tạo câu hỏi đa dạng**: Tự động sinh câu hỏi trắc nghiệm với nhiều định dạng:
  - ![image](https://github.com/user-attachments/assets/084ce9eb-eae0-41d2-831c-1ea7e0a314bc)

    - Câu hỏi nhiều lựa chọn (MCQ)
    - Câu hỏi Đúng/Sai (True/False)
    - Câu hỏi điền khuyết (Fill-in-the-blank)
- **Tùy chỉnh linh hoạt**: Điều chỉnh tỷ lệ trích xuất, độ dài tóm tắt, số lượng câu hỏi.
  - ![image](https://github.com/user-attachments/assets/6fa69a69-f5f8-4b1c-b2b9-6ef79083c968)

- **Xử lý văn bản dài**: Hỗ trợ phân đoạn (chunking) để phân tích văn bản lớn.
- **Xuất kết quả**: Cho phép tải xuống câu hỏi dưới dạng file `.txt`.
  - ![image](https://github.com/user-attachments/assets/0ae871b3-e4ee-402f-ba95-0b0c9f7f9270)


## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js, React, Tailwind CSS
- **UI Components**: Shadcn UI
- **AI**: Google Gemini API / OpenAI API
- **NLP**: TextRank, PhoBERT (thông qua API chưa tích hợp)

## ⚙️ Cài đặt và chạy

### Yêu cầu

- Node.js `>=18.0.0`
- npm hoặc yarn

### Cài đặt

Clone repository:

```bash
git clone https://github.com/yourusername/vn-summarizer-qgen.git
cd vn-summarizer-qgen
```

Cài dependencies:

```bash
npm install
# hoặc
yarn install
```
Tạo file .env.local và thêm API key:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
# hoặc
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here (chưa tích hợp)
```
Chạy ứng dụng ở chế độ phát triển:

```bash
npm run dev
# hoặc
yarn dev
```
Mở trình duyệt tại: http://localhost:3000

## 🧪 Cách sử dụng

1. **Nhập văn bản**: Dán văn bản tiếng Việt cần xử lý.
2. **Phân tích**: Nhấn nút `Phân tích` để bắt đầu quá trình.
3. **Xem kết quả**: Chuyển giữa các tab để xem phân tích, tóm tắt và câu hỏi.
4. **Tùy chỉnh**: Thay đổi thông số trong tab `Cấu hình` nếu muốn.
5. **Tải xuống**: Tải câu hỏi về dưới dạng `.txt`.

## 🧱 Kiến trúc hệ thống định hướng

### 1. Mô-đun Tóm tắt
- **TextRank**: Trích xuất 20% câu quan trọng từ văn bản.
- **PhoBERT**: Diễn đạt lại câu theo cách tự nhiên và ngắn gọn.

### 2. Mô-đun Tạo câu hỏi
- **PhoBERT**: Nhận diện nội dung chính và sinh câu hỏi đa dạng.
- **Heuristic**: Tạo các lựa chọn gây nhiễu thông minh theo quy tắc ngữ nghĩa.


## 📬 Liên hệ
- Email: thamkhang2003@gmail.com


