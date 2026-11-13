import { useState } from "react";
import { api, setToken } from "./api";
import Icon from "./Icons";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const reg = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setMsg({ text: "", ok: false }); setBusy(true);
    try {
      if (reg) {
        await api("/api/auth/register", f);
        setMode("login");
        setMsg({ text: "Registered! Now login.", ok: true });
      } else {
        const d = await api("/api/auth/login", { email: f.email, password: f.password });
        setToken(d.token);
        onLogin(d);
      }
    } catch (err) { setMsg({ text: err.message, ok: false }); }
    setBusy(false);
  }

  const feats = [
    ["quiz", "AI Quiz Generator", "Practice with quizzes and get your score instantly."],
    ["book", "Topic Explainer", "Hard topics explained in simple language."],
    ["calendar", "Study Planner", "A daily schedule built around your exam date."],
  ];

  return (
    <div className="authwrap">
      <div className="authhero">
        <div className="brand"><Icon name="cap" size={30} /> SmartStudy AI</div>
        <h1>Learn Smarter. Prepare Better. Achieve More.</h1>
        <p>Your personal AI learning assistant, powered by Google Gemini.</p>
        {feats.map(([ic, t, d]) => (
          <div className="feat" key={t}><span className="ic"><Icon name={ic} /></span><div><b>{t}</b><span>{d}</span></div></div>
        ))}
      </div>
      <div className="authform">
        <form className="card" onSubmit={submit}>
          <div className="brand" style={{ color: "var(--p)", marginBottom: 6 }}><Icon name="cap" size={26} /> SmartStudy AI</div>
          <h2>{reg ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">{reg ? "Register to start learning." : "Login to continue to your dashboard."}</p>
          {reg && <><label>Full name</label><input value={f.name} onChange={set("name")} /></>}
          <label>Email</label><input type="email" value={f.email} onChange={set("email")} />
          <label>Password (min 6 characters)</label><input type="password" value={f.password} onChange={set("password")} />
          <button type="submit" disabled={busy} style={{ width: "100%" }}>{reg ? "Create account" : "Login"}</button>
          <p style={{ color: msg.ok ? "var(--ok)" : "var(--no)" }}>{msg.text}</p>
          <p className="muted">{reg ? "Already registered?" : "New student?"}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(reg ? "login" : "register"); setMsg({ text: "", ok: false }); }}>
              {reg ? "Login here" : "Register here"}</a></p>
        </form>
      </div>
    </div>
  );
}
