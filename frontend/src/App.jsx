import { useState, useEffect, useCallback } from "react";
import { api, getToken, setToken, logoutRequest } from "./api.js";
import Landing from "./views/Landing.jsx";
import Auth from "./views/Auth.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Quiz from "./views/Quiz.jsx";
import Explain from "./views/Explain.jsx";
import Plan from "./views/Plan.jsx";
import History from "./views/History.jsx";

const TABS = [
  ["dash", "🏠 Dashboard"],
  ["quiz", "📝 Quiz"],
  ["explain", "💡 Explainer"],
  ["plan", "📅 Study Plan"],
  ["hist", "🕘 History"],
];

export default function App() {
  const [screen, setScreen] = useState(getToken() ? "loading" : "landing");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dash");

  const logout = useCallback(() => {
    logoutRequest();
    setToken(null);
    setUser(null);
    setScreen("landing");
  }, []);

  // call the API and log out automatically if the session expired
  const call = useCallback((url, data) => api(url, data, { onExpired: logout }), [logout]);

  const enter = (u) => {
    setUser(u);
    setView("dash");
    setScreen("app");
  };

  // restore session on page load
  useEffect(() => {
    if (!getToken()) return;
    api("/api/me")
      .then(enter)
      .catch(() => {
        setToken(null);
        setScreen("landing");
      });
  }, []);

  if (screen === "loading") return null;
  if (screen === "landing") return <Landing onLogin={() => setScreen("auth")} />;
  if (screen === "auth")
    return <Auth onHome={() => setScreen("landing")} onLoggedIn={enter} />;

  return (
    <div id="app">
      <div className="nav">
        <span className="logo">🎓 SmartStudy AI</span>
        <span>
          <b>{user.name}</b> <span className="muted">{user.email}</span>{" "}
          <button className="alt" onClick={logout}>Logout</button>
        </span>
      </div>
      <div className="layout">
        <div className="side">
          {TABS.map(([id, label]) => (
            <button key={id} className={view === id ? "on" : ""} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="main">
          {view === "dash" && <Dashboard user={user} call={call} go={setView} />}
          {view === "quiz" && <Quiz call={call} />}
          {view === "explain" && <Explain call={call} />}
          {view === "plan" && <Plan call={call} />}
          {view === "hist" && <History call={call} />}
        </div>
      </div>
    </div>
  );
}
