import { useEffect, useState } from "react";
import { api } from "./api";
import Icon from "./Icons";

export function DashboardView({ user, go, quizzes, plans }) {
  const n = quizzes.length;
  const avg = n ? Math.round(quizzes.reduce((a, x) => a + x.score, 0) / n) : 0;
  const best = n ? Math.max(...quizzes.map((x) => x.score)) : 0;
  const stats = [
    ["quiz", "indigo", "Quizzes taken", n],
    ["trend", "green", "Average score", n ? avg + "%" : "—"],
    ["award", "amber", "Best score", n ? best + "%" : "—"],
    ["calendar", "pink", "Study plans", plans.length],
  ];
  const feats = [
    ["quiz", "indigo", "Quiz Generator", "Generate AI-powered quizzes for any subject.", "quiz"],
    ["book", "amber", "Topic Explainer", "Understand difficult topics with AI assistance.", "explain"],
    ["calendar", "green", "Study Planner", "Create personalized study schedules.", "plan"],
  ];
  const last = quizzes.slice(0, 7).reverse();
  const recent = [
    ...quizzes.map((x) => ({ t: x.created_at, ic: "quiz", c: "indigo", s: `Quiz on ${x.topic} (${x.subject}) — ${x.score}%` })),
    ...plans.map((x) => ({ t: x.created_at, ic: "calendar", c: "green", s: `Study plan: ${x.subjects.join(", ")}` })),
  ].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 5);

  return (
    <div>
      <h2 style={{ fontSize: 24 }}>Welcome back, {user.name.split(" ")[0]}</h2>
      <p className="muted" style={{ marginTop: 0 }}>Ready to learn something new today?</p>

      <div className="stats">
        {stats.map(([ic, c, label, val]) => (
          <div className="card stat" key={label}>
            <span className={"tile t-" + c}><Icon name={ic} size={24} /></span>
            <div><b>{val}</b><span className="muted">{label}</span></div>
          </div>
        ))}
      </div>

      <h3>Learning tools</h3>
      <div className="grid" style={{ marginBottom: 18 }}>
        {feats.map(([ic, c, t, d, v]) => (
          <div className="card fcard" key={t}>
            <span className={"tile t-" + c}><Icon name={ic} size={24} /></span>
            <h3>{t}</h3><p>{d}</p>
            <button onClick={() => go(v)}>Open <Icon name="arrow" size={16} /></button>
          </div>
        ))}
      </div>

      <div className="two">
        <div className="card"><h3>Recent activity</h3>
          {recent.length ? recent.map((x, i) => (
            <div className="act" key={i}>
              <span className={"tile sm t-" + x.c}><Icon name={x.ic} size={18} /></span>
              <div>{x.s}<div className="muted">{x.t.replace("T", " ")}</div></div>
            </div>
          )) : <p className="muted">No activity yet. Try your first quiz!</p>}
        </div>
        <div className="card"><h3>Quiz scores</h3>
          {last.length ? (
            <div className="bars">
              {last.map((x, i) => (
                <div className="bcol" key={i} title={`${x.topic}: ${x.score}%`}>
                  <span>{x.score}%</span><div className="bar" style={{ height: Math.max(x.score, 3) * 0.95 + "%" }} />
                </div>
              ))}
            </div>
          ) : <p className="muted">Your quiz scores will appear here.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, go }) {
  const [d, setD] = useState({ q: [], p: [] });
  useEffect(() => {
    Promise.all([api("/api/quiz/history"), api("/api/study-plan/history")])
      .then(([q, p]) => setD({ q, p })).catch(() => {});
  }, []);
  return <DashboardView user={user} go={go} quizzes={d.q} plans={d.p} />;
}
