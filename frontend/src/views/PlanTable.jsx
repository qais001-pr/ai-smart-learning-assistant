export default function PlanTable({ p }) {
  return (
    <>
      <p className="muted">
        Subjects: {p.subjects.join(", ")} · {p.daily_hours} h/day · Exam: {p.exam_date}
        {p.priority ? " · Priority: " + p.priority : ""}
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Day</th><th>Date</th><th>Subject</th><th>Topic</th><th>Duration</th></tr>
          </thead>
          <tbody>
            {p.schedule.map((s, i) => (
              <tr key={i}>
                <td>{s.day}</td><td>{s.date}</td><td>{s.subject}</td><td>{s.topic}</td><td>{s.hours} h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
