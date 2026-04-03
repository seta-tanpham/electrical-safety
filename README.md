# Electrical Safety Training Fullstack Demo

This package contains a runnable **fullstack demo** for an electrical safety training app:

- **Backend**: Express + PostgreSQL
- **Frontend**: React + Vite
- **Flow**:
  - lessons unlock sequentially
  - each lesson ends with a timed quiz
  - learner must pass the lesson quiz to unlock the next lesson
  - admin dashboard shows total learners, passed learners, pass rate, and average score

## Project structure

```text
electrical-safety-fullstack-complete/
├─ backend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ sql/
│  │  └─ schema.sql
│  └─ src/
│     ├─ server.ts
│     ├─ routes/
│     │  └─ training.ts
│     └─ seeds/
│        ├─ curriculum.seed.ts
│        └─ electrical-safety.seed.ts
└─ frontend/
   ├─ package.json
   ├─ tsconfig.json
   ├─ vite.config.ts
   ├─ .env.example
   ├─ index.html
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      ├─ styles.css
      └─ api/
         └─ client.ts
```

## Backend setup

### 1) Install dependencies

```bash
cd backend
npm install
```

### 2) Create database

```sql
CREATE DATABASE electrical_safety;
```

### 3) Configure environment

Copy `.env.example` to `.env` and update `DATABASE_URL` if needed.

### 4) Run schema

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

### 5) Seed curriculum data

```bash
npm run db:seed
```

### 6) Start backend

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:3001
```

## Frontend setup

### 1) Install dependencies

```bash
cd frontend
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env`.

By default:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3) Start frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Main backend endpoints

### Read APIs

- `GET /health`
- `GET /api/courses`
- `GET /api/courses/:courseId/overview`
- `GET /api/courses/:courseId/lessons`
- `GET /api/courses/:courseId/lessons/:lessonId`
- `GET /api/courses/:courseId/resources`
- `GET /api/courses/:courseId/users/:userId/progress`
- `GET /api/courses/:courseId/lessons/:lessonId/users/:userId/quiz-attempts/latest`
- `GET /api/courses/:courseId/admin-stats`

### Write APIs

- `POST /api/courses/:courseId/enrollments`
- `POST /api/courses/:courseId/lessons/:lessonId/quiz-attempts`

## Notes

- Lesson quiz scoring currently treats **option index 0** as the correct answer for lesson-level quizzes generated from `quizPrompts`.
- The frontend uses a fixed demo user:
  - `demo_user_001`
- The frontend is standalone and does **not** depend on shadcn/ui or Tailwind.

## Suggested next improvements

- add auth and roles
- add admin content management
- add retry limits per lesson quiz
- add certificates and completion reports
- dockerize backend + frontend + postgres
