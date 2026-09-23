import { Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Assignment1 from './pages/Assignment1.jsx';
import Assignment2 from './pages/Assignment2.jsx';
import Assignment3 from './pages/Assignment3.jsx';
import Assignment4 from './pages/Assignment4.jsx';
import Assignment5 from './pages/Assignment5.jsx';

const assignmentPages = [Assignment1, Assignment2, Assignment3, Assignment4, Assignment5];

function NotFound() {
  return (
    <section className="assignment-panel">
      <h2>Page not found</h2>
      <Link to="/">Back to assignments</Link>
    </section>
  );
}

function AssignmentPage() {
  const { number } = useParams();
  if (!/^[1-5]$/.test(number)) return <NotFound />;

  const Content = assignmentPages[Number(number) - 1];
  return (
    <section className="assignment-panel" aria-labelledby="assignment-title" key={number}>
      <h2 id="assignment-title">Assignment {number}</h2>
      <Content />
    </section>
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <p className="course-name">SYDE 572 · Pattern Recognition</p>
        <h1>Assignments</h1>
      </header>
      <main>
        <nav className="assignment-tabs" aria-label="Assignments">
          {assignmentPages.map((_, index) => (
            <NavLink
              key={index + 1}
              to={`/assignments/${index + 1}`}
              className={({ isActive }) => `assignment-tab${isActive ? ' active' : ''}`}
            >
              Assignment {index + 1}
            </NavLink>
          ))}
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/assignments/1" replace />} />
          <Route path="/assignments/:number" element={<AssignmentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
