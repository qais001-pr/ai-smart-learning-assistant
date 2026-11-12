import { useState } from "react";
import PlanTable from "./PlanTable.jsx";

const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export default function Plan({ call }) {
  const [f, setF] = useState({
    subjects: "", hours: "3", date: "", level: "Beginner", priority: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const subs = f.subjects.split(",").map((s) => s.trim()).filter(Boolean);

  const run = async () => {
    setLoading(true); setError(""); setPlan(null);
    try {
      setPlan(
        await call("/api/study-plan/generate", {
          subjects: f.subjects,
          daily_hours: +f.hours,
          exam_date: f.date,
          level: f.level,
          priority: f.priority,
        })
      );
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Study Planner</h2>
      <div className="card">
        <label>Subjects (separate with commas)</label>
        <input value={f.subjects} onChange={set("subjects")} placeholder="Computer Networks, Database Systems, Operating Systems" />
        <label>Available hours per day</label>
        <input type="number" min="0.5" max="12" step="0.5" value={f.hours} onChange={set("hours")} />
        <label>Exam date</label>
        <input type="date" min={tomorrow} value={f.date} onChange={set("date")} />
        <label>Study level</label>
        <select value={f.level} onChange={set("level")}>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
        <label>Priority subject</label>
        <select value={f.priority} onChange={set("priority")}>
          <option value="">None</option>
          {subs.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button disabled={loading} onClick={run}>
          {loading ? "Planning... please wait" : "Generate Study Plan"}
        </button>
      </div>

      {error && <p className="err">{error}</p>}
      {plan && (
        <div className="card">
          <h3>Your Study Plan</h3>
          <PlanTable p={plan} />
          {plan.fallback_topics && (
            <p className="err">AI topic suggestions were unavailable, so general topics are shown. Check your internet and API key.</p>
          )}
          {plan.days_left > plan.days_planned && (
            <p className="muted">Showing the next {plan.days_planned} days ({plan.days_left} days until your exam).</p>
          )}
        </div>
      )}
    </div>
  );
}
