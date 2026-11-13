import { useState } from "react";
import { api } from "./api";

export default function Quiz() {
  const [f, setF] = useState({ subject: "", topic: "", difficulty: "Medium", count: 5 });
  const [quiz, setQuiz] = useState(null);
  const [picked, setPicked] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function generate() {
    setBusy(true); setErr(""); setQuiz(null); setResult(null); setPicked({});
    try { setQuiz(await api("/api/quiz/generate", { ...f, count: +f.count })); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function submit() {
    try {
      const answers = quiz.questions.map((_, i) => picked[i] ?? -1);
      setResult(await api("/api/quiz/submit", { quiz_id: quiz.quiz_id, answers }));
      window.scrollTo(0, 0);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <p className="muted sub">Choose a topic and test yourself with AI-made questions.</p>
      <div className="card">
        <label>Subject</label><input value={f.subject} onChange={set("subject")} placeholder="e.g. Computer Networks" />
        <label>Topic</label><input value={f.topic} onChange={set("topic")} placeholder="e.g. OSI Model" />
        <label>Difficulty</label>
        <select value={f.difficulty} onChange={set("difficulty")}><option>Easy</option><option>Medium</option><option>Hard</option></select>
        <label>Number of questions</label>
        <select value={f.count} onChange={set("count")}><option>5</option><option>10</option><option>15</option></select>
        <button disabled={busy} onClick={generate}>{busy ? "Generating... please wait" : "Generate Quiz"}</button>
      </div>
      {err && <p className="err">{err}</p>}

      {result ? (
        <>
          <div className="card score"><h2>Score: {result.score}%</h2>
            <p>Total Questions: {result.total} · Correct: {result.correct} · Incorrect: {result.incorrect}</p></div>
          {result.results.map((x, i) => (
            <div key={i} className={"card " + (x.is_correct ? "ok" : "no")}>
              <b>{i + 1}. {x.question}</b>
              <p>Your answer: {x.chosen >= 0 ? x.options[x.chosen] : "Skipped"}</p>
              <p>Correct answer: <b>{x.options[x.answer]}</b></p>
              {x.explanation && <p className="muted">{x.explanation}</p>}
            </div>
          ))}
        </>
      ) : quiz && (
        <>
          <div className="card"><b>{quiz.subject}</b> · {quiz.topic} · {quiz.difficulty}</div>
          {quiz.questions.map((q, i) => (
            <div key={i} className="card">
              <b>{i + 1}. {q.question}</b>
              {q.options.map((o, j) => (
                <label key={j} className={"opt" + (picked[i] === j ? " sel" : "")}>
                  <input type="radio" name={"q" + i} checked={picked[i] === j} onChange={() => setPicked({ ...picked, [i]: j })} />
                  {"ABCD"[j]}. {o}
                </label>
              ))}
            </div>
          ))}
          <button onClick={submit}>Submit Answers</button>
        </>
      )}
    </div>
  );
}
