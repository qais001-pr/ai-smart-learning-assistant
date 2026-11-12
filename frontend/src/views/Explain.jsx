import { useState } from "react";

const List = ({ items }) => (
  <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
);

export default function Explain({ call }) {
  const [form, setForm] = useState({ subject: "", topic: "", level: "Beginner" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [d, setD] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async () => {
    setLoading(true); setError(""); setD(null);
    try {
      setD(await call("/api/explain", form));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Topic Explainer</h2>
      <div className="card">
        <label>Subject</label>
        <input value={form.subject} onChange={set("subject")} placeholder="e.g. Cloud Computing" />
        <label>Topic</label>
        <input value={form.topic} onChange={set("topic")} placeholder="e.g. Kubernetes Pods" />
        <label>Explanation level</label>
        <select value={form.level} onChange={set("level")}>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
        <button disabled={loading} onClick={run}>{loading ? "Thinking..." : "Explain"}</button>
      </div>

      {error && <p className="err">{error}</p>}
      {d && (
        <>
          <div className="card"><h3>Simple Definition</h3>{d.simple_definition}</div>
          <div className="card"><h3>How It Works</h3>{d.how_it_works}</div>
          <div className="card"><h3>Real-World Example</h3>{d.real_world_example}</div>
          <div className="card"><h3>Important Concepts</h3><List items={d.important_concepts} /></div>
          <div className="card"><h3>Key Points to Remember</h3><List items={d.key_points} /></div>
        </>
      )}
    </div>
  );
}
