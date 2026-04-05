# Frontend refactor

Frontend này giữ kiểu giao diện theo từng khung như bản cũ, nhưng đã tách thành các component riêng:

- HeaderOverviewCard
- LearningSidebarCard
- LessonWorkspaceCard
- LessonReaderPanel
- LessonProgressCard
- LessonQuizCard

## Chạy local

```bash
npm install
npm run dev
```

## Lưu ý

- Bản này dùng trực tiếp `LearnerPage` trong `App.tsx`
- Không còn cục "Chế độ xem"
- Phần quy trình cứu nạn đã bỏ
- Quiz chỉ hiện khi người học bấm bắt đầu
- Sidebar vẫn giữ luồng mở khóa / khóa / click bài học
