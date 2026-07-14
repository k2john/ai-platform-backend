# AI Interview Platform — Node.js + TypeScript Backend

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Database | Supabase (PostgreSQL) |
| STT | OpenAI Whisper |
| Evaluation | OpenAI GPT-4o |
| TTS | ElevenLabs |
| Avatar | D-ID |
| File Upload | Multer |

## Project Structure

```
src/
├── server.ts               # Entrypoint — starts Express server
├── app.ts                  # Express app, middleware, routes
├── config/
│   ├── index.ts            # Loads + validates env variables
│   ├── security.ts         # JWT sign/verify + bcrypt hash/verify
│   └── schemas.ts          # Zod validation schemas for all routes
├── db/
│   └── supabase.ts         # Supabase client singleton
├── middleware/
│   ├── auth.ts             # authenticate, requireAdmin, requireStudent
│   ├── validate.ts         # Zod request body validation middleware
│   └── errorHandler.ts     # Global error handler + createError helper
├── services/
│   ├── authService.ts      # Register, login, getUserById, updateUser
│   ├── courseService.ts    # CRUD + student assignment
│   ├── avatarService.ts    # CRUD for D-ID avatars
│   ├── questionService.ts  # CRUD with rubric support
│   ├── interviewService.ts # CRUD + start/end lifecycle
│   ├── responseReportService.ts  # Save responses + upsert reports
│   └── aiService.ts        # Whisper + GPT-4o + ElevenLabs + D-ID
├── routes/
│   ├── auth.ts             # /api/auth/*
│   ├── courses.ts          # /api/courses/*
│   ├── avatars.ts          # /api/avatars/*
│   ├── questions.ts        # /api/questions/*
│   ├── interviews.ts       # /api/interviews/*
│   ├── responsesReports.ts # /api/responses/* + /api/reports/*
│   └── ai.ts               # /api/ai/* (transcribe, evaluate, avatar, TTS)
└── types/
    └── index.ts            # All TypeScript interfaces + AuthRequest
```

## Setup

### 1. Install dependencies
```bash
cd backend-node
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values
```

### 3. Set up Supabase DB
Run `../backend/app/db/schema.sql` in your Supabase SQL Editor (same schema).

### 4. Run in development
```bash
npm run dev
# Server starts at http://localhost:8000
# Auto-reloads on file changes via tsx watch
```

### 5. Build for production
```bash
npm run build   # Compiles TypeScript → dist/
npm start       # Runs compiled JS
```

## API Endpoints

All endpoints are identical to the Python FastAPI version:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login, get JWT |
| GET | `/api/auth/me` | JWT | Current user profile |
| PUT | `/api/auth/me` | JWT | Update profile |
| GET | `/api/courses/` | JWT | List all courses |
| GET | `/api/courses/my` | JWT | Student's courses |
| POST | `/api/courses/` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Delete course |
| POST | `/api/courses/:id/assign/:studentId` | Admin | Assign student |
| GET | `/api/avatars/` | JWT | List avatars |
| POST | `/api/avatars/` | Admin | Create avatar |
| GET | `/api/questions/` | JWT | List questions (course_id param) |
| POST | `/api/questions/` | Admin | Create question with rubric |
| GET | `/api/interviews/` | JWT | List interviews |
| POST | `/api/interviews/` | Admin | Schedule interview |
| POST | `/api/interviews/:id/start` | JWT | Mark in_progress |
| POST | `/api/interviews/:id/end` | JWT | Mark completed |
| POST | `/api/responses/` | JWT | Save student response |
| GET | `/api/responses/` | JWT | Get responses (interview_id param) |
| GET | `/api/reports/` | JWT | Get report (interview_id param) |
| POST | `/api/reports/` | JWT | Generate/update report |
| POST | `/api/ai/transcribe` | JWT | Transcribe from URL (Whisper) |
| POST | `/api/ai/transcribe/upload` | JWT | Upload audio blob → transcribe |
| POST | `/api/ai/evaluate` | JWT | Evaluate answer (GPT-4o) |
| POST | `/api/ai/avatar/speak` | JWT | Generate D-ID avatar video |
| GET | `/api/ai/avatar/speak/:talkId` | JWT | Poll D-ID status |
| POST | `/api/ai/tts` | JWT | ElevenLabs text-to-speech (MP3) |
| POST | `/api/ai/evaluate/interview/:id` | JWT | Auto-evaluate all + generate report |

## Deployment (Render)

1. Create **Web Service** on Render
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all `.env` variables in **Environment**
