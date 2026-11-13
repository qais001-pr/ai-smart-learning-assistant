import { useEffect, useState } from "react";
import { api } from "./api";
import { PlanTable } from "./Planner";

export default function History() {
  const [q, setQ] = useState(null);
  const [p, setP] = useState(null);
  useEffect(() => {
    api("/api/quiz/history").then(setQ).catch(() => setQ([]));
    api("/api/study-plan/history").then(setP).catch(() => setP([]));
  }, []);
  return (
    <div>
      <p className="muted sub">Your saved quizzes and study plans.</p>
      <div className="card"><h3>Quizzes</h3>
        {!q ? "Loading..." : q.length ? (
          <div className="scroll"><table>
            <thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Level</th><th>Score</th></tr></thead>
            <tbody>{q.map((x) => (
              <tr key={x.id}><td>{x.created_at.replace("T", " ")}</td><td>{x.subject}</td><td>{x.topic}</td><td>{x.difficulty}</td><td>{x.correct}/{x.total} ({x.score}%)</td></tr>
            ))}</tbody>
          </table></div>
        ) : "No quizzes yet."}
      </div>
      <div className="card"><h3>Study plans</h3>
        {!p ? "Loading..." : p.length ? p.map((x) => (
          <details key={x.id}><summary>{x.subjects.join(", ")} — exam {x.exam_date}</summary><PlanTable p={x} /></details>
        )) : "No study plans yet."}
      </div>
    </div>
  );
}
