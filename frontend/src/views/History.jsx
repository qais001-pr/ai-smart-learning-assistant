import { useState, useEffect } from "react";
import PlanTable from "./PlanTable.jsx";

export default function History({ call }) {
  const [q, setQ] = useState(null);
  const [p, setP] = useState(null);

  useEffect(() => {
    call("/api/quiz/history").then(setQ).catch(() => setQ([]));
    call("/api/study-plan/history").then(setP).catch(() => setP([]));
  }, [call]);

  return (
    <div>
      <h2>History</h2>
      <div className="card">
        <h3>Quizzes</h3>
        <div className="scroll">
          {q && q.length === 0 && "No quizzes yet."}
          {q && q.length > 0 && (
            <table>
              <thead><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Level</th><th>Score</th></tr></thead>
              <tbody>
                {q.map((x, i) => (
                  <tr key={i}>
                    <td>{x.created_at.replace("T", " ")}</td><td>{x.subject}</td><td>{x.topic}</td>
                    <td>{x.difficulty}</td><td>{x.correct}/{x.total} ({x.score}%)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card">
        <h3>Study plans</h3>
        {p && p.length === 0 && "No study plans yet."}
        {p && p.map((x, i) => (
          <details key={i}>
            <summary>{x.subjects.join(", ")} — exam {x.exam_date}</summary>
            <PlanTable p={x} />
          </details>
        ))}
      </div>
    </div>
  );
}
