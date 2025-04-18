import { Inter } from "next/font/google";
import "./globals.css";

// Sử dụng font Inter thay vì Geist (phổ biến hơn trong các dự án Next.js)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "VN-Summarizer-QGen",
  description: "Ứng dụng tóm tắt và tạo câu hỏi cho văn bản tiếng Việt",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased bg-gray-100`}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}