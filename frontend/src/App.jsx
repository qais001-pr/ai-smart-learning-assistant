import { useEffect, useState } from "react";
import { api, hasToken, setToken, setExpiredHandler } from "./api";
import Icon from "./Icons";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Quiz from "./Quiz";
import Explain from "./Explain";
import Planner from "./Planner";
import History from "./History";

const NAV = [
  ["dash", "home", "Dashboard"], ["quiz", "quiz", "Quiz Generator"], ["explain", "book", "Topic Explainer"],
  ["plan", "calendar", "Study Planner"], ["hist", "clock", "History"],
];

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dash");

  function enter(u) { setUser(u); setView("dash"); }
  function logout() {
    if (hasToken()) api("/api/auth/logout", {}).catch(() => {});
    setToken(null); setUser(null);
  }

  useEffect(() => {
    setExpiredHandler(() => { setToken(null); setUser(null); });
    if (hasToken()) api("/api/me").then(enter).catch(() => {});
  }, []);

  if (!user) return <Auth onLogin={enter} />;   // before login, the login page is shown

  const title = NAV.find((x) => x[0] === view)[2];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><Icon name="cap" size={26} /> SmartStudy AI</div>
        <nav className="nav">
          {NAV.map(([k, ic, label]) => (
            <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}><Icon name={ic} size={19} /> {label}</button>
          ))}
        </nav>
        <div className="me">
          <div className="avatar">{user.name[0].toUpperCase()}</div>
          <div className="info"><b>{user.name}</b><small>{user.email}</small></div>
          <button title="Logout" onClick={logout}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <div className="content">
        <div className="topbar"><h1>{title}</h1><span className="muted">{today}</span></div>
        <div className="main">
          {view === "dash" && <Dashboard user={user} go={setView} />}
          {view === "quiz" && <Quiz />}
          {view === "explain" && <Explain />}
          {view === "plan" && <Planner />}
          {view === "hist" && <History />}
        </div>
      </div>
    </div>
  );
}
