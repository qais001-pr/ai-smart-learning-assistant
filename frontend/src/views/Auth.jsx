import { useState } from "react";
import { api, setToken } from "../api.js";

export default function Auth({ onHome, onLoggedIn }) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: false });

  const toggle = () => {
    setRegister(!register);
    setMsg({ text: "", ok: false });
  };

  const submit = async () => {
    setMsg({ text: "", ok: false });
    try {
      if (register) {
        await api("/api/auth/register", { name, email, password: pass });
        setRegister(false);
        setMsg({ text: "Registered! Now login.", ok: true });
      } else {
        const d = await api("/api/auth/login", { email, password: pass });
        setToken(d.token);
        setPass("");
        onLoggedIn(d);
      }
    } catch (e) {
      setMsg({ text: e.message, ok: false });
    }
  };

  return (
    <div>
      <div className="nav">
        <span className="logo">🎓 SmartStudy AI</span>
        <button className="alt" onClick={onHome}>Home</button>
      </div>
      <div className="card auth">
        <h2>{register ? "Register" : "Login"}</h2>
        {register && (
          <>
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password (min 6 characters)</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button onClick={submit}>{register ? "Create account" : "Login"}</button>
        <p className={msg.ok ? "ok-msg" : "err"}>{msg.text}</p>
        <p className="muted">
          <span>{register ? "Already registered?" : "New student?"}</span>{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); toggle(); }}>
            {register ? "Login here" : "Register here"}
          </a>
        </p>
      </div>
    </div>
  );
}
