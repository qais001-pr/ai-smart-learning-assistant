import { useState } from "react";
import { api } from "./api";

export function PlanTable({ p }) {
  return (
    <>
      <p className="muted">Subjects: {p.subjects.join(", ")} · {p.daily_hours} h/day · Exam: {p.exam_date}{p.priority ? " · Priority: " + p.priority : ""}</p>
      <div className="scroll"><table>
        <thead><tr><th>Day</th><th>Date</th><th>Subject</th><th>Topic</th><th>Duration</th></tr></thead>
        <tbody>{p.schedule.map((s, i) => (
          <tr key={i}><td>{s.day}</td><td>{s.date}</td><td>{s.subject}</td><td>{s.topic}</td><td>{s.hours} h</td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

export default function Planner() {
  const [f, setF] = useState({ subjects: "", daily_hours: 3, exam_date: "", level: "Beginner", priority: "" });
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const subs = f.subjects.split(",").map((s) => s.trim()).filter(Boolean);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  async function generate() {
    setBusy(true); setErr(""); setPlan(null);
    try { setPlan(await api("/api/study-plan/generate", { ...f, daily_hours: +f.daily_hours })); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <p className="muted sub">Tell us your subjects and exam date, and get a daily schedule.</p>
      <div className="card">
        <label>Subjects (separate with commas)</label>
        <input value={f.subjects} onChange={set("subjects")} placeholder="Computer Networks, Database Systems, Operating Systems" />
        <label>Available hours per day</label>
        <input type="number" min="0.5" max="12" step="0.5" value={f.daily_hours} onChange={set("daily_hours")} />
        <label>Exam date</label><input type="date" min={tomorrow} value={f.exam_date} onChange={set("exam_date")} />
        <label>Study level</label>
        <select value={f.level} onChange={set("level")}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <label>Priority subject</label>
        <select value={f.priority} onChange={set("priority")}>
          <option value="">None</option>{subs.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button disabled={busy} onClick={generate}>{busy ? "Planning... please wait" : "Generate Study Plan"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      {plan && (
        <div className="card"><h3>Your Study Plan</h3>
          <PlanTable p={plan} />
          {plan.fallback_topics && <p className="err">AI topic suggestions were unavailable, so general topics are shown. Check your internet and API key.</p>}
          {plan.days_left > plan.days_planned && <p className="muted">Showing the next {plan.days_planned} days ({plan.days_left} days until your exam).</p>}
        </div>
      )}
    </div>
  );
}
