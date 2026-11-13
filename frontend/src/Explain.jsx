import { useState } from "react";
import { api } from "./api";

const List = ({ items }) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export default function Explain() {
  const [f, setF] = useState({ subject: "", topic: "", level: "Beginner" });
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function explain() {
    setBusy(true); setErr(""); setOut(null);
    try { setOut(await api("/api/explain", f)); } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <p className="muted sub">Get a clear, structured explanation of any difficult topic.</p>
      <div className="card">
        <label>Subject</label><input value={f.subject} onChange={set("subject")} placeholder="e.g. Cloud Computing" />
        <label>Topic</label><input value={f.topic} onChange={set("topic")} placeholder="e.g. Kubernetes Pods" />
        <label>Explanation level</label>
        <select value={f.level} onChange={set("level")}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <button disabled={busy} onClick={explain}>{busy ? "Thinking..." : "Explain"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      {out && (
        <>
          <div className="card"><h3>Simple Definition</h3>{out.simple_definition}</div>
          <div className="card"><h3>How It Works</h3>{out.how_it_works}</div>
          <div className="card"><h3>Real-World Example</h3>{out.real_world_example}</div>
          <div className="card"><h3>Important Concepts</h3><List items={out.important_concepts} /></div>
          <div className="card"><h3>Key Points to Remember</h3><List items={out.key_points} /></div>
        </>
      )}
    </div>
  );
}
