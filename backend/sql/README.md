# Backend patch proposal

Bản này là patch đề xuất để backend hỗ trợ model mới cho lesson content + resources.

## Mục tiêu
Tách lesson thành:
- sections: nội dung chính
- resources: học liệu đính kèm
- tracking completion cho section/resource
- unlock quiz dựa trên mức độ hoàn thành

## Các phần có trong thư mục
- `sql/001_lesson_sections_resources.sql`
- `sample-seed/lesson-detail-sample.json`
- `api-contract.json`

## Gợi ý API
- `GET /courses/:courseId/lessons/:lessonId`
  - trả về `sections[]`
  - mỗi section có `resources[]`
- `POST /courses/:courseId/lessons/:lessonId/section-progress`
- `POST /courses/:courseId/lessons/:lessonId/resource-progress`
- `GET /courses/:courseId/lessons/:lessonId/users/:userId/readiness`
  - trả `canStartQuiz`
