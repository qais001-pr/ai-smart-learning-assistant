from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from datetime import date, datetime, timedelta
import requests, json, os, sqlite3, hashlib, hmac, secrets, random, re, time
from concurrent.futures import ThreadPoolExecutor

DB_PATH = os.getenv("DB_PATH", "data/smartstudy.db")
app = FastAPI(title="SmartStudy AI")

# ---------------- Database (SQLite) ----------------
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
def db():
    c = sqlite3.connect(DB_PATH); c.row_factory = sqlite3.Row; return c
def now(): return datetime.now().isoformat(timespec="seconds")

with db() as c:
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,
        email TEXT UNIQUE, salt TEXT, password_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER, created_at TEXT);
    CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
        subject TEXT, topic TEXT, difficulty TEXT, questions TEXT, score INTEGER,
        correct INTEGER, total INTEGER, submitted INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS plans(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
        subjects TEXT, daily_hours REAL, exam_date TEXT, priority TEXT, schedule TEXT, created_at TEXT);
    """)

# ---------------- Authentication ----------------
def hp(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt), 100_000).hex()

class Reg(BaseModel):
    name: str
    email: str
    password: str

class Log(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register(r: Reg):
    name, email = r.name.strip(), r.email.strip().lower()
    if not name or "@" not in email: raise HTTPException(400, "Enter a valid name and email")
    if len(r.password) < 6: raise HTTPException(400, "Password must be at least 6 characters")
    salt = secrets.token_hex(16)
    try:
        with db() as c:
            c.execute("INSERT INTO users(name,email,salt,password_hash,created_at) VALUES(?,?,?,?,?)",
                      (name, email, salt, hp(r.password, salt), now()))
    except sqlite3.IntegrityError:
        raise HTTPException(400, "This email is already registered")
    return {"message": "Registered"}

@app.post("/api/auth/login")
def login(r: Log):
    with db() as c:
        u = c.execute("SELECT * FROM users WHERE email=?", (r.email.strip().lower(),)).fetchone()
        if not u or not hmac.compare_digest(hp(r.password, u["salt"]), u["password_hash"]):
            raise HTTPException(401, "Wrong email or password")
        t = secrets.token_hex(32)
        c.execute("INSERT INTO sessions VALUES(?,?,?)", (t, u["id"], now()))
    return {"token": t, "name": u["name"], "email": u["email"]}

def current_user(authorization: str = Header(None)):
    if not authorization: raise HTTPException(401, "Please log in")
    with db() as c:
        u = c.execute("SELECT u.*, s.created_at AS sc FROM sessions s JOIN users u ON u.id=s.user_id "
                      "WHERE s.token=?", (authorization,)).fetchone()
    if not u or datetime.fromisoformat(u["sc"]) < datetime.now() - timedelta(days=7):
        raise HTTPException(401, "Session expired, please log in")
    return u

@app.post("/api/auth/logout")
def logout(authorization: str = Header(None)):
    if authorization:
        with db() as c: c.execute("DELETE FROM sessions WHERE token=?", (authorization,))
    return {"message": "Logged out"}

@app.get("/api/me")
def me(u=Depends(current_user)): return {"name": u["name"], "email": u["email"]}

# ---------------- AI helper: Google Gemini API (always asks for JSON) ----------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
THINK = os.getenv("GEMINI_THINKING_LEVEL", "").strip().lower()   # optional: minimal / low / medium / high
POOL = ThreadPoolExecutor(max_workers=8)                                    # lets several AI calls run at the same time
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"
last_error = ""

def ai_ready():
    return bool(GEMINI_API_KEY) and GEMINI_API_KEY != "PASTE_YOUR_KEY_HERE"

def need_ai():
    global last_error
    last_error = ""
    if not ai_ready():
        raise HTTPException(503, "AI is not set up. Add your Gemini API key to the .env file and restart.")

def ai_fail(msg):
    return HTTPException(502, msg + (f" ({last_error})" if last_error else ""))

def ask_json(prompt):
    global last_error
    cfg = {"responseMimeType": "application/json"}
    if THINK: cfg["thinkingConfig"] = {"thinkingLevel": THINK}   # less "thinking" = faster answers
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": cfg}
    headers = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}   # key stays on the server
    for attempt in range(3):
        r = requests.post(GEMINI_URL.format(GEMINI_MODEL), headers=headers, json=body, timeout=120)
        if r.status_code in (429, 500, 503) and attempt < 2:      # busy or rate-limited: wait and retry
            time.sleep(3 * (attempt + 1)); continue
        if r.status_code != 200:
            try: msg = r.json()["error"]["message"]
            except Exception: msg = r.text[:200]
            last_error = f"Gemini error {r.status_code}: {msg}"[:300]
            raise RuntimeError(last_error)
        parts = r.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
        return json.loads(re.sub(r"^```(?:json)?|```$", "", text).strip())

@app.get("/api/health")
def health(test: int = 0):
    """Open /api/health?test=1 in the browser to check your key and model name."""
    out = {"ai_configured": ai_ready(), "model": GEMINI_MODEL, "thinking_level": THINK or "default"}
    if test and ai_ready():
        t0 = time.time()
        try: ask_json('Reply ONLY as JSON like {"ok": true}'); out["test"] = "OK"
        except Exception as e: out["test"] = str(last_error or e)
        out["seconds"] = round(time.time() - t0, 1)
    return out

def need(text, name, mx=200):
    text = (text or "").strip()
    if not text or len(text) > mx: raise HTTPException(400, f"Please enter a valid {name}")
    return text

# ---------------- Module 1: Quiz ----------------
QFORMAT = '{"questions":[{"question":"...","options":["...","...","...","..."],"answer":"A","explanation":"one short sentence"}]}'

def clean_q(q):
    try:
        opts = [re.sub(r"^[A-Da-d][\).:]\s+", "", str(o)).strip() for o in q["options"]][:4]
        a = str(q["answer"]).strip()
        if len(a) == 1 and a.upper() in "ABCD": idx = "ABCD".index(a.upper())
        else:
            low = [o.lower() for o in opts]; idx = low.index(a.lower()) if a.lower() in low else -1
        if len(opts) != 4 or len(set(opts)) < 4 or idx < 0 or not str(q["question"]).strip(): return None
        right = opts[idx]; random.shuffle(opts)   # shuffle: small models love putting answer at A
        return {"question": str(q["question"]).strip(), "options": opts, "answer": opts.index(right),
                "explanation": str(q.get("explanation", ""))}
    except Exception:
        return None

def one_batch(subject, topic, difficulty, k):
    try:
        data = ask_json(f'Create {k} {difficulty} multiple choice questions about "{topic}" (subject: {subject}). '
                        'Exactly 4 different short options each, one correct. Keep each explanation under 12 words. '
                        'Reply ONLY as JSON like: ' + QFORMAT)
        return [q for q in map(clean_q, data.get("questions", [])) if q]
    except Exception:
        return []

def make_questions(subject, topic, difficulty, n):
    sizes = [min(5, n - i) for i in range(0, n, 5)]        # e.g. 15 questions -> 3 requests of 5, sent at the same time
    batches = list(POOL.map(lambda k: one_batch(subject, topic, difficulty, k), sizes))
    qs, seen = [], set()
    def add(items):
        for q in items:
            if q["question"].lower() not in seen and len(qs) < n:
                seen.add(q["question"].lower()); qs.append(q)
    for b in batches: add(b)
    for _ in range(2):                                      # top up if some questions were rejected or duplicated
        if len(qs) >= n: break
        add(one_batch(subject, topic, difficulty, n - len(qs)))
    return qs

class QuizReq(BaseModel):
    subject: str
    topic: str
    difficulty: str = "Medium"
    count: int = 5

@app.post("/api/quiz/generate")
def quiz_generate(r: QuizReq, u=Depends(current_user)):
    need_ai()
    subject, topic = need(r.subject, "subject"), need(r.topic, "topic")
    if r.difficulty not in ("Easy", "Medium", "Hard") or r.count not in (5, 10, 15):
        raise HTTPException(400, "Invalid difficulty or question count")
    qs = make_questions(subject, topic, r.difficulty, r.count)
    if not qs: raise ai_fail("The AI could not make questions. Please try again.")
    with db() as c:
        cur = c.execute("INSERT INTO quizzes(user_id,subject,topic,difficulty,questions,total,created_at) "
                        "VALUES(?,?,?,?,?,?,?)", (u["id"], subject, topic, r.difficulty, json.dumps(qs), len(qs), now()))
    # correct answers stay on the server until the quiz is submitted
    return {"quiz_id": cur.lastrowid, "subject": subject, "topic": topic, "difficulty": r.difficulty,
            "questions": [{"question": q["question"], "options": q["options"]} for q in qs]}

class SubmitReq(BaseModel):
    quiz_id: int
    answers: list[int]

@app.post("/api/quiz/submit")
def quiz_submit(r: SubmitReq, u=Depends(current_user)):
    with db() as c:
        row = c.execute("SELECT * FROM quizzes WHERE id=? AND user_id=?", (r.quiz_id, u["id"])).fetchone()
        if not row: raise HTTPException(404, "Quiz not found")
        if row["submitted"]: raise HTTPException(400, "This quiz was already submitted")
        qs = json.loads(row["questions"]); results, correct = [], 0
        for i, q in enumerate(qs):
            chosen = r.answers[i] if i < len(r.answers) else -1
            ok = chosen == q["answer"]; correct += ok
            results.append({**q, "chosen": chosen, "is_correct": ok})
        score = round(100 * correct / len(qs))
        c.execute("UPDATE quizzes SET score=?, correct=?, submitted=1 WHERE id=?", (score, correct, r.quiz_id))
    return {"total": len(qs), "correct": correct, "incorrect": len(qs) - correct, "score": score, "results": results}

@app.get("/api/quiz/history")
def quiz_history(u=Depends(current_user)):
    with db() as c:
        rows = c.execute("SELECT id,subject,topic,difficulty,score,correct,total,created_at FROM quizzes "
                         "WHERE user_id=? AND submitted=1 ORDER BY id DESC LIMIT 30", (u["id"],)).fetchall()
    return [dict(x) for x in rows]

# ---------------- Module 2: Topic Explainer ----------------
EFORMAT = ('{"simple_definition":"...","how_it_works":"...","real_world_example":"...",'
           '"important_concepts":["..."],"key_points":["..."]}')

class ExplainReq(BaseModel):
    subject: str
    topic: str
    level: str = "Beginner"

@app.post("/api/explain")
def explain(r: ExplainReq, u=Depends(current_user)):
    need_ai()
    subject, topic = need(r.subject, "subject"), need(r.topic, "topic", 500)
    if r.level not in ("Beginner", "Intermediate", "Advanced"): raise HTTPException(400, "Invalid level")
    for _ in range(2):
        try:
            d = ask_json(f'Explain "{topic}" (subject: {subject}) for a {r.level} student in simple language. '
                         'Reply ONLY as JSON like: ' + EFORMAT)
            out = {k: str(d[k]).strip() for k in ("simple_definition", "how_it_works", "real_world_example")}
            for k in ("important_concepts", "key_points"):
                v = d[k]; out[k] = [str(x) for x in v] if isinstance(v, list) else [str(v)]
            if all(out.values()): return out
        except Exception:
            pass
    raise ai_fail("The AI could not explain this. Please try again.")

# ---------------- Module 3: Study Planner ----------------
def get_topics(subject, level, k=8):
    try:
        d = ask_json(f'List {k} important study topics for the subject "{subject}" for a {level} student, '
                     'in a good learning order. Reply ONLY as JSON like: {"topics":["topic 1","topic 2"]}')
        t = [str(x).strip() for x in d.get("topics", []) if str(x).strip()]
        if t: return t[:k], False
    except Exception:
        pass
    return ["Core concepts", "Key terms", "Worked examples", "Practice questions", "Revision"], True

def build_schedule(subjects, hours, days, priority, topics):
    """Python (not the AI) splits the time, so the hours are always correct."""
    blocks = max(1, round(hours * 2))                     # 30-minute blocks per day
    w = {s: 2 if s.lower() == priority.lower() else 1 for s in subjects}   # priority subject gets double time
    idx, sched = {s: 0 for s in subjects}, []
    for d in range(days):
        day = date.today() + timedelta(days=d)
        if blocks >= len(subjects):
            tw, n = sum(w.values()), len(subjects)
            raw = {s: blocks * w[s] / tw for s in subjects}
            cnt = {s: int(raw[s]) for s in subjects}
            order = sorted(subjects, key=lambda s: (round(raw[s] - cnt[s], 6), w[s], -((subjects.index(s) - d) % n)), reverse=True)
            for s in order[:blocks - sum(cnt.values())]: cnt[s] += 1
            for s in subjects:                            # every subject gets at least 30 minutes
                if cnt[s] == 0:
                    m = max(subjects, key=lambda x: cnt[x]); cnt[m] -= 1; cnt[s] = 1
        else:                                             # fewer blocks than subjects: rotate them
            pri = [s for s in subjects if w[s] == 2]; oth = [s for s in subjects if w[s] == 1]
            k = d % len(oth) if oth else 0; oth = oth[k:] + oth[:k]
            cnt = {s: 1 for s in (pri + oth)[:blocks]}
        for s, c in cnt.items():
            t = topics[s]
            sched.append({"date": day.isoformat(), "day": day.strftime("%A"), "subject": s,
                          "topic": t[idx[s] % len(t)], "hours": c * 0.5}); idx[s] += 1
    return sched

class PlanReq(BaseModel):
    subjects: str
    daily_hours: float
    exam_date: str
    level: str = "Beginner"
    priority: str = ""

@app.post("/api/study-plan/generate")
def plan_generate(r: PlanReq, u=Depends(current_user)):
    need_ai()
    subjects = []
    for s in r.subjects.split(","):
        s = s.strip()
        if s and s.lower() not in [x.lower() for x in subjects]: subjects.append(s[:60])
    if not 1 <= len(subjects) <= 5: raise HTTPException(400, "Enter 1 to 5 subjects, separated by commas")
    if not 0.5 <= r.daily_hours <= 12: raise HTTPException(400, "Daily hours must be between 0.5 and 12")
    try: exam = date.fromisoformat(r.exam_date)
    except ValueError: raise HTTPException(400, "Enter a valid exam date")
    left = (exam - date.today()).days
    if left < 1: raise HTTPException(400, "The exam date must be in the future")
    got = dict(zip(subjects, POOL.map(lambda s: get_topics(s, r.level), subjects)))          # (topics, used_fallback)
    sched = build_schedule(subjects, r.daily_hours, min(left, 14), r.priority.strip(),
                           {s: g[0] for s, g in got.items()})
    with db() as c:
        c.execute("INSERT INTO plans(user_id,subjects,daily_hours,exam_date,priority,schedule,created_at) "
                  "VALUES(?,?,?,?,?,?,?)", (u["id"], json.dumps(subjects), r.daily_hours, r.exam_date,
                                            r.priority, json.dumps(sched), now()))
    return {"subjects": subjects, "daily_hours": r.daily_hours, "exam_date": r.exam_date,
            "priority": r.priority, "days_planned": min(left, 14), "days_left": left, "schedule": sched,
            "fallback_topics": any(g[1] for g in got.values())}

@app.get("/api/study-plan/history")
def plan_history(u=Depends(current_user)):
    with db() as c:
        rows = c.execute("SELECT * FROM plans WHERE user_id=? ORDER BY id DESC LIMIT 20", (u["id"],)).fetchall()
    return [{"id": x["id"], "subjects": json.loads(x["subjects"]), "daily_hours": x["daily_hours"],
             "exam_date": x["exam_date"], "priority": x["priority"],
             "schedule": json.loads(x["schedule"]), "created_at": x["created_at"]} for x in rows]

@app.get("/")
def root():
    return {"app": "SmartStudy AI backend", "docs": "/docs"}
