# SMART QUIZ GENERATOR AI (MERN)

Full-stack AI learning application using:
- Frontend: React (existing UI)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- File parsing: PDF/DOCX/TXT/PPTX
- AI: OpenAI (optional, with local fallbacks)

## Project Progress Tracking

| S no | Module/Feature | Planned Features | Completion Status | Remarks |
|------|---|---|---|---|
| 1 | User Authentication | Login, Signup, JWT Auth, Password Hashing | ✅ Completed | Working fine - bcryptjs + JWT implemented |
| 2 | Dashboard UI | User Profile, Statistics, Welcome Screen | ✅ Completed | React dashboard with user stats |
| 3 | Backend Core | Express Setup, Middleware, Error Handling | ✅ Completed | Full Express server with auth middleware |
| 4 | Database Models | User, Assignment, Quiz, Submission, Files | ✅ Completed | MongoDB Mongoose schemas implemented |
| 5 | File Upload & Parsing | PDF/DOCX/TXT/PPTX Support, Storage Management | ✅ Completed | Multer + pdf-parse integrated |
| 6 | Quiz Generation | AI-based Question Generation, Quiz Attempts | ✅ Completed | OpenAI integration with local fallback |
| 7 | Quiz Management | Submit Quiz, Store Results, Scoring | ✅ Completed | QuizAttempt model & services ready |
| 8 | Chatbot System | Chat Interface, Conversation History, AI Responses | ✅ Completed | Chat service with history tracking |
| 9 | Text Summarization | Document Summary Generation, Storage | ✅ Completed | Summary service with vector storage |
| 10 | Vector Store/FAISS | Embeddings, Chunk Storage, Retrieval | ✅ Completed | FAISS indexes created & stored |
| 11 | Assignment Management | Faculty Assignment Creation, Student Submission | ✅ Completed | Models & routes for assignments |
| 12 | History & Analytics | User History, Attempt Tracking, Performance Metrics | ✅ Completed | History service & pages implemented |
| 13 | Results Dashboard | Quiz Results, Performance Charts, Analytics | ✅ Completed | Results page with data display |
| 14 | API Integration (Frontend) | GET/POST/PUT endpoints, Error Handling, Loading States | 🔄 In Progress | API calls integrated, testing needed |
| 15 | Frontend UI Polish | Responsive Design, Tailwind CSS, User Experience | 🔄 In Progress | Tailwind configured, needs refinement |
| 16 | Payment Gateway | Secure Transactions, Multiple Payment Methods | ⏳ Not Started | Planned for next phase |
| 17 | Deployment | Docker Setup, Production Build, Server Config | 🔄 In Progress | Dockerfile created, needs CI/CD |

## What Changed

This project has been migrated from a Flask backend to a Node/Express backend while preserving the same API paths and frontend behavior.

API compatibility retained:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /upload`
- `POST /generate-quiz`
- `POST /submit-quiz`
- `GET /summary?doc_id=<id>`
- `POST /chat`
- `GET /history`

## Project Structure

```text
frontend/              # React app
server/                # Node + Express backend
  app.js
  config/
  middleware/
  models/
  routes/
  services/
  utils/
storage/               # Uploaded files + retrieval chunks
Dockerfile
package.json           # Backend scripts/deps
```

## Environment

Create `.env` in project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_quiz_ai
JWT_SECRET=change-this
JWT_EXP_HOURS=24
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini
MAX_UPLOAD_MB=15
UPLOAD_DIR=storage/uploads
VECTOR_DIR=storage/vectors
CORS_ORIGINS=http://localhost:3000
```

## Run Backend

```bash
npm install
npm run server
```

Backend runs on `http://localhost:5000`.

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000` and calls backend at `http://localhost:5000` by default.

Optional frontend env (`frontend/.env`):

```env
REACT_APP_API_URL=http://localhost:5000
```

## Run Full Stack Together

From project root:

```bash
npm run dev
```

This runs backend (`5000`) and frontend (`3000`) concurrently.

## Docker (Backend)

```bash
docker build -t smart-quiz-generator-ai-mern .
docker run --rm -p 5000:5000 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/smart_quiz_ai \
  -e JWT_SECRET=change-this \
  -e OPENAI_API_KEY=your-openai-key \
  smart-quiz-generator-ai-mern
```

## Notes

- OpenAI is optional. If `OPENAI_API_KEY` is missing, quiz/summary/chat still work using deterministic fallback logic.
- Upload supports `pdf`, `docx`, `txt`, and `pptx`. Legacy `ppt` files are accepted by extension but may not contain extractable text.
