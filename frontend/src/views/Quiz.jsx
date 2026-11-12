import { useState } from "react";

export default function Quiz({ call }) {
  const [form, setForm] = useState({ subject: "", topic: "", difficulty: "Medium", count: "5" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const generate = async () => {
    setLoading(true); setError(""); setQuiz(null); setResult(null); setAnswers({});
    try {
      setQuiz(await call("/api/quiz/generate", { ...form, count: +form.count }));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const submit = async () => {
    const list = quiz.questions.map((_, i) => (answers[i] ?? -1));
    try {
      setResult(await call("/api/quiz/submit", { quiz_id: quiz.quiz_id, answers: list }));
      window.scrollTo(0, 0);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h2>Quiz Generator</h2>
      <div className="card">
        <label>Subject</label>
        <input value={form.subject} onChange={set("subject")} placeholder="e.g. Computer Networks" />
        <label>Topic</label>
        <input value={form.topic} onChange={set("topic")} placeholder="e.g. OSI Model" />
        <label>Difficulty</label>
        <select value={form.difficulty} onChange={set("difficulty")}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <label>Number of questions</label>
        <select value={form.count} onChange={set("count")}>
          <option>5</option><option>10</option><option>15</option>
        </select>
        <button disabled={loading} onClick={generate}>
          {loading ? "Generating... please wait" : "Generate Quiz"}
        </button>
        <p className="muted">A quiz usually takes a few seconds to generate.</p>
      </div>

      {error && <p className="err">{error}</p>}

      {result ? (
        <>
          <div className="card score">
            <h2>Score: {result.score}%</h2>
            <p>Total Questions: {result.total} · Correct: {result.correct} · Incorrect: {result.incorrect}</p>
          </div>
          {result.results.map((x, i) => (
            <div key={i} className={"card " + (x.is_correct ? "ok" : "no")}>
              <b>{i + 1}. {x.question}</b>
              <p>Your answer: {x.chosen >= 0 ? x.options[x.chosen] : "Skipped"}</p>
              <p>Correct answer: <b>{x.options[x.answer]}</b></p>
              {x.explanation && <p className="muted">{x.explanation}</p>}
            </div>
          ))}
        </>
      ) : (
        quiz && (
          <>
            <div className="card"><b>{quiz.subject}</b> · {quiz.topic} · {quiz.difficulty}</div>
            {quiz.questions.map((q, i) => (
              <div className="card" key={i}>
                <b>{i + 1}. {q.question}</b>
                {q.options.map((o, j) => (
                  <label className="opt" key={j}>
                    <input
                      type="radio"
                      name={"q" + i}
                      checked={answers[i] === j}
                      onChange={() => setAnswers({ ...answers, [i]: j })}
                    />
                    {"ABCD"[j]}. {o}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={submit}>Submit Answers</button>
          </>
        )
      )}
    </div>
  );
}
