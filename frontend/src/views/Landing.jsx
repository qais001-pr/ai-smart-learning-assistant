export default function Landing({ onLogin }) {
  return (
    <div>
      <div className="nav">
        <span className="logo">🎓 SmartStudy AI</span>
        <button className="alt" onClick={onLogin}>Login</button>
      </div>
      <div className="hero wrap">
        <h1>Learn Smarter. Prepare Better. Achieve More.</h1>
        <p>
          An AI learning assistant that makes quizzes, explains hard topics, and plans your study
          time. Powered by Google Gemini AI.
        </p>
        <button onClick={onLogin}>Get Started</button>
      </div>
      <div className="wrap grid">
        <div className="card"><h3>📝 Quiz Generator</h3>Practice with AI-made multiple-choice quizzes and get your score instantly.</div>
        <div className="card"><h3>💡 Topic Explainer</h3>Understand difficult topics in simple language with real examples.</div>
        <div className="card"><h3>📅 Study Planner</h3>Get a daily schedule based on your subjects, hours, and exam date.</div>
      </div>
    </div>
  );
}
