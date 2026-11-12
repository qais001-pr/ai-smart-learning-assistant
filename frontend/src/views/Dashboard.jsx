import { useState, useEffect } from "react";

export default function Dashboard({ user, call, go }) {
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    Promise.all([call("/api/quiz/history"), call("/api/study-plan/history")])
      .then(([q, p]) => {
        const all = [
          ...q.map((x) => ({ t: x.created_at, s: `📝 Quiz: ${x.topic} (${x.subject}) — ${x.score}%` })),
          ...p.map((x) => ({ t: x.created_at, s: `📅 Study plan: ${x.subjects.join(", ")}` })),
        ]
          .sort((a, b) => b.t.localeCompare(a.t))
          .slice(0, 5);
        setRecent(all);
      })
      .catch(() => setRecent([]));
  }, [call]);

  return (
    <div>
      <h2>Welcome, {user.name} 👋</h2>
      <div className="grid">
        <div className="card"><h3>📝 Quiz Generator</h3><p>Generate AI-powered quizzes for any subject.</p><button onClick={() => go("quiz")}>Open</button></div>
        <div className="card"><h3>💡 Topic Explainer</h3><p>Understand difficult topics with AI assistance.</p><button onClick={() => go("explain")}>Open</button></div>
        <div className="card"><h3>📅 Study Planner</h3><p>Create personalized study schedules.</p><button onClick={() => go("plan")}>Open</button></div>
      </div>
      <div className="card">
        <h3>Recent activities</h3>
        <div className="muted">
          {recent === null && "Loading..."}
          {recent && recent.length === 0 && "No activity yet. Try a quiz!"}
          {recent && recent.map((x, i) => (
            <div key={i}>{x.s} <span className="muted">{x.t.replace("T", " ")}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
