# Electrical Safety Learning Workspace

Frontend demo cho bài toán đào tạo an toàn điện.

## Điểm chính
- Giữ layout theo từng khung:
  - Header overview
  - Sidebar lộ trình học
  - Khung bài học
  - Reader panel nội dung chính
  - Resource panel học liệu
  - Tiến độ học tập
  - Bài kiểm tra cuối bài
- Reader panel hỗ trợ sections + resources
- Quiz chỉ hiện khi học viên hoàn thành nội dung và học liệu bắt buộc

## Chạy project
```bash
npm install
npm run dev
```

## Biến môi trường
Tạo `.env` từ `.env.example` nếu muốn đổi backend:
```bash
VITE_PROXY_TARGET=http://localhost:3001
```
