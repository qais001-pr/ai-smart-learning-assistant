# 🎓 SmartStudy AI (MVP)

**Learn Smarter. Prepare Better. Achieve More.**

SmartStudy AI is a web app that helps students learn: it **generates quizzes**, **explains difficult topics**, and **creates personalized study plans**. The AI is powered by the **Google Gemini API** (needs internet and a free API key).

**Made by:** [Daniyal] | **Class ** [ICS REG II]  
**Event:** Science Exhibition | **Supervisor:** [Muhammad Qais]

---

## 1. Problem
Students find it hard to understand complex concepts, prepare for exams, practice with relevant questions, and manage their study time.

## 2. Solution and MVP Features
| Module | Feature |
|---|---|
| Authentication | Student sign up and login (passwords stored hashed, sessions expire after 7 days) |
| Dashboard | Welcome message, three tool cards, profile, and recent activities |
| **Quiz Generator** | Subject, topic, difficulty (Easy/Medium/Hard), and 5/10/15 questions. The quiz is checked **on the server** and shows total, correct, incorrect, and score % with a review |
| **Topic Explainer** | Subject, topic, and level (Beginner/Intermediate/Advanced). Gives a Simple Definition, How It Works, Real-World Example, Important Concepts, and Key Points |
| **Study Planner** | Subjects, daily hours, exam date, level, and priority subject. Gives a Day/Date/Subject/Topic/Duration table, with extra time for the priority subject |
| History | Saved past quizzes and study plans |

**Not in this MVP:** voice assistant, video tutoring, communities, teacher/admin dashboards, leaderboards, mobile app, advanced analytics, document summarization.

## 3. How It Works
```
Student (Browser: React app, served by Nginx)
        │  /api calls (Nginx forwards them to the backend) + login token
        ▼
FastAPI backend (Python)  ── SQLite (users, quizzes, study plans)
        │  prompt (AI replies in JSON)
        ▼
Google Gemini API (internet)
```
1. The student logs in and fills a form.
2. FastAPI checks the login token and sends a prompt to the Gemini API.
3. The AI replies in **structured JSON**, which the backend validates.
4. Quizzes and plans are saved in SQLite. Correct answers stay on the server until the quiz is submitted.
5. Study time is split by Python code (so hours always add up); the AI suggests the topics.

## 4. Technology Stack
| Part | Technology |
|---|---|
| Frontend | **React** (Vite), served by **Nginx** (responsive) |
| Backend | **FastAPI** (Python) |
| Database | SQLite |
| AI | **Google Gemini API** |
| Authentication | Hashed passwords (PBKDF2) + session tokens |
| Containers | **Docker + Docker Compose** |

## 5. API Endpoints
| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Log in (returns token) |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/me` | Current student profile |
| POST | `/api/quiz/generate` | Generate quiz (answers hidden) |
| POST | `/api/quiz/submit` | Evaluate quiz on the server |
| GET | `/api/quiz/history` | Quiz history |
| POST | `/api/explain` | Explain a topic |
| POST | `/api/study-plan/generate` | Generate study plan |
| GET | `/api/study-plan/history` | Study plan history |

All endpoints except register and login need a valid login token. API test page: `http://127.0.0.1:3000/docs`

## 6. Project Structure
```
SmartStudyAI/
├── backend/
│   ├── main.py               # FastAPI server, database, login, and Gemini AI logic
│   ├── requirements.txt      # Python packages
│   └── Dockerfile            # Builds the backend container
├── frontend/
│   ├── src/                  # React code (App, Quiz, Explain, Planner, History, api.js)
│   ├── index.html            # React entry page
│   ├── package.json          # React and Vite packages
│   ├── vite.config.js        # Vite settings
│   ├── nginx.conf            # Serves the site and forwards /api to the backend
│   └── Dockerfile            # Builds the React app, then serves it with Nginx
├── docker-compose.yml        # Runs 2 services: backend and frontend
├── .env.example              # Template for the API key file (.env is never uploaded)
├── .gitignore
└── README.md                 # This file
```

## 7. How to Run
**Requirements:** Windows 10/11, Docker Desktop (WSL2), internet, and a free Gemini API key from **aistudio.google.com** (Get API key).

Open Command Prompt inside the project folder, then:
```bash
copy .env.example .env          # first time only
notepad .env                    # paste your key after GEMINI_API_KEY=, then save
docker compose up -d --build    # build and start both services (backend + frontend)
```
Open **http://127.0.0.1:3000**. To stop: `docker compose down`. To see errors: `docker logs ai-backend`.

The key is stored only in the local `.env` file, which is never uploaded to GitHub. The backend API test page is at `http://127.0.0.1:8000/docs`. To check the AI connection, open `http://127.0.0.1:3000/api/health?test=1`.

## 8. Demo Flow
1. Landing page → **Get Started** → register → login.
2. **Quiz:** Computer Networks / OSI Model / Medium / 5 questions → answer → Submit → see the score.
3. **Explainer:** Cloud Computing / Kubernetes Pods / Beginner.
4. **Planner:** 3 subjects, 3 hours/day, an exam date, and a priority subject.
5. **History:** show saved quizzes and plans.

## 9. Limitations
- Needs an internet connection and a Gemini API key; the free tier has rate limits.
- AI answers can contain mistakes, so important facts should be double-checked.
- The study plan shows at most the next 14 days.
- MVP security: no HTTPS, email verification, or password reset.

## 10. Future Improvements
PDF upload for quizzes, weak-area detection, adaptive difficulty, progress charts, AI chat tutor, study reminders, flashcards, an offline mode with a local model, and deployment on a school server.

## 11. Project Status
- [ ] Docker running and Gemini API key added
- [ ] Backend and database working
- [ ] Login and registration working
- [ ] Quiz, Explainer, and Planner tested
- [ ] History working
- [ ] Poster and presentation ready

---
*Built with FastAPI, Google Gemini API, SQLite, and Docker.*
