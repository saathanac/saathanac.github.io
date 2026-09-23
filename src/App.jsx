import { Link, Route, Routes } from 'react-router-dom';
import Assignment1 from './pages/Assignment1.jsx';

export default function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={
          <>
            <h1>Welcome to My SYDE 572 Portfolio!</h1>
            <p>Course assignments and projects.</p>
            <nav aria-label="Assignments">
              <Link to="/assignments/1">Assignment 1</Link>
            </nav>
          </>
        } />
        <Route path="/assignments/1" element={<Assignment1 />} />
        <Route path="*" element={
          <>
            <h1>Page not found</h1>
            <Link to="/">Back to portfolio</Link>
          </>
        } />
      </Routes>
    </main>
  );
}
