import { useEffect, useRef, useState } from 'react';
import M from '../assignment1/Math.jsx';
import data from '../assignment1/results.json';
import Examples from '../assignment1/Examples.jsx';
import Part2 from '../assignment1/Part2.jsx';
import { AnalyticalWork, NewtonWork, GoldenWork, PointWork, Plot, fixed, pointName } from '../assignment1/WorkedSolutions.jsx';
import '../assignment1/assignment.css';

const sections = [['problem', 'Problem'], ['analytical', 'Analytical'], ['newton', 'Newton–Raphson'], ['golden', 'Golden-section'], ['comparison', 'Results'], ['examples', 'Non-polynomial examples']];

export default function Assignment1() {
  const [selected, setSelected] = useState(0);
  const article = useRef(null);
  useEffect(() => {
    let closed = [];
    let printing = false;
    const before = () => {
      if (printing) return;
      printing = true;
      closed = [...article.current.querySelectorAll('details:not([open])')];
      closed.forEach(detail => { detail.open = true; });
    };
    const after = () => { closed.forEach(detail => { detail.open = false; }); closed = []; printing = false; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);

  const work = (Component) => data.cases.map((c, i) => <PointWork key={i} caseData={c} selected={i === selected}><Component c={c} index={i} /></PointWork>);
  return <article className="assignment-one" ref={article}>
    <div className="part-heading"><h3>Part 1 · Distance from a curve</h3></div>
    <nav className="section-nav" aria-label="Part 1 sections">
      {sections.map(([id, label]) => <button type="button" key={id} onClick={() => { const target = document.getElementById(id); target.scrollIntoView(); target.focus({ preventScroll: true }); }}>{label}</button>)}
    </nav>

    <section id="problem" tabIndex="-1" className="solution-section">
      <h3>1. Problem and geometry</h3>
      <p>Find the shortest distance from <M>{'y=x^2+5'}</M> to each of (0, 0), (−4, 0), (−8, 0), (2, 0), and (6, 0).</p>
      <p className="print-note">Full solution: all five assigned points are included below.</p>
      <p>The given point is <M>{'P=(x_0,y_0)'}</M>, and <M>{'Q=(x,x^2+5)'}</M> is a point on the parabola. We choose x so that Q is as close as possible to P. This closest point is <M>{'Q^*'}</M>.</p>
    </section>

    <section id="analytical" tabIndex="-1" className="solution-section">
      <h3>2. Analytical solution</h3>
      <h4>Distance and squared distance</h4>
      <M block>{String.raw`d(x)=\sqrt{(x-x_0)^2+(x^2+5-y_0)^2}`}</M>
      <M block>{String.raw`D(x)=(x-x_0)^2+(x^2+5-y_0)^2`}</M>
      <h4>Find the closest point</h4>
      <p>To optimize the distance function, set the first derivative of its square to zero to find the critical points.</p>
      <M block>{String.raw`D'(x)=2(x-x_0)\cdot1+2(x^2+5-y_0)\cdot2x`}</M>
      <M block>{String.raw`D'(x)=2(x-x_0)+4x(x^2+5-y_0)`}</M>
      <M block>{String.raw`D'(x)=0\quad\Longleftrightarrow\quad 2x^3+(11-2y_0)x-x_0=0`}</M>
      <p>For the assigned points, <M>{'y_0=0'}</M>.</p>
      <div className="point-controls"><label htmlFor="point-select">Worked point</label><select id="point-select" value={selected} onChange={e => setSelected(Number(e.target.value))}>{data.cases.map((c, i) => <option value={i} key={i}>P = {pointName(c)}</option>)}</select><span className="selection-note" aria-live="polite">Calculations and plots show P = {pointName(data.cases[selected])}.</span></div>
      {data.cases.map((c, i) => <PointWork key={i} caseData={c} selected={i === selected}>
        <AnalyticalWork c={c} />
        <Plot index={i} kind="geometry" caption={`Geometry for P = ${pointName(c)}. The segment joins P to Q*, the closest point on y = x² + 5.`} />
      </PointWork>)}
      <h4>Analytical results</h4>
      <div className="table-scroll" tabIndex="0" role="region" aria-label="Analytical results for all five points">
        <table>
          <caption>Coordinates and minimum distances, rounded to six decimal places.</caption>
          <thead><tr><th scope="col">Given point P</th><th scope="col">Closest point Q*</th><th scope="col">Minimum distance</th></tr></thead>
          <tbody>{data.cases.map(c => <tr key={c.point[0]}>
            <th scope="row">{pointName(c)}</th>
            <td>({fixed(c.analytical.x, 6)}, {fixed(c.analytical.y, 6)})</td>
            <td>{fixed(c.analytical.distance, 6)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section id="newton" tabIndex="-1" className="solution-section">
      <h3>3. Newton–Raphson</h3>
      <p>Newton–Raphson uses the first and second derivatives of the squared-distance function D to find where its first derivative is zero.</p>
      <M block>{String.raw`x^{(k+1)}=x^{(k)}-\frac{D'(x^{(k)})}{D''(x^{(k)})}`}</M>
      <p>Since <M>{'y_0=0'}</M> for every assigned point, the derivatives simplify to:</p>
      <M block>{String.raw`D'(x)=2(x-x_0)+4x(x^2+5)=4x^3+22x-2x_0`}</M>
      <M block>{String.raw`D''(x)=12x^2+22`}</M>
      <p>Substitute these into the update formula and cancel the common factor of 2:</p>
      <M block>{String.raw`x^{(k+1)}=x^{(k)}-\frac{4(x^{(k)})^3+22x^{(k)}-2x_0}{12(x^{(k)})^2+22}`}</M>
      <M block>{String.raw`x^{(k+1)}=x^{(k)}-\frac{2(x^{(k)})^3+11x^{(k)}-x_0}{6(x^{(k)})^2+11}`}</M>
      <p>Here, <M>{'x^{(k)}'}</M> is the current estimate, while <M>{'x_0'}</M> is the given point’s x-coordinate. Repeat the update until the first derivative is approximately zero.</p>
      {work(NewtonWork)}
    </section>

    <section id="golden" tabIndex="-1" className="solution-section">
      <h3>4. Golden-section search</h3>
      <p>Golden-section search finds the closest point by comparing squared distances at two x-values and narrowing the search range, without using derivatives.</p>
      <p>We start with [−2, 2], which contains the closest point’s x-coordinate for each assigned point. The method assumes there is just one minimum in the search range.</p>
      <h4>Golden ratio and its inverse</h4>
      <M block>{String.raw`\text{Golden ratio:}\qquad \varphi=\frac{1+\sqrt5}{2}\approx1.618033989`}</M>
      <M block>{String.raw`\text{Inverse golden ratio:}\qquad r=\frac{1}{\varphi}=\frac{\sqrt5-1}{2}\approx0.618033989`}</M>
      <p>Use the inverse golden ratio to place two test points, u and v, inside the current interval [a, b]:</p>
      <M block>{String.raw`u=b-r(b-a),\qquad v=a+r(b-a)`}</M>
      <ul className="method-rules"><li>If D(u) &lt; D(v), keep [a, v].</li><li>If D(u) &gt; D(v), keep [u, b].</li><li>If D(u) = D(v), keep [u, v]. The closest point’s x-coordinate lies between the two test points.</li></ul>
      <p>Repeat until the interval is very small, then use its midpoint to estimate the closest point Q and the minimum distance.</p>
      {work(GoldenWork)}
    </section>

    <section id="comparison" tabIndex="-1" className="solution-section">
      <h3>5. Results comparison</h3>
      <div className="table-scroll" tabIndex="0" role="region" aria-label="All assigned results"><table>
        <caption>All five assigned points. Coordinates and distances are rounded to six decimal places.</caption>
        <thead><tr>{['Point P', 'Closest point Q* (analytical)', 'Analytical d', 'Newton d', 'Golden d'].map(v => <th key={v} scope="col">{v}</th>)}</tr></thead>
        <tbody>{data.cases.map(c => <tr key={c.point[0]}><th scope="row">{pointName(c)}</th><td>({fixed(c.analytical.x, 6)}, {fixed(c.analytical.y, 6)})</td><td>{fixed(c.analytical.distance, 6)}</td><td>{fixed(c.newton.distance, 6)}</td><td>{fixed(c.golden.distance, 6)}</td></tr>)}</tbody>
      </table></div>
      <p>All three methods give the same minimum distances to six decimal places. For these points, Newton–Raphson needs fewer iterations than golden-section search, while golden-section search works without derivatives.</p>
    </section>

    <section id="examples" tabIndex="-1" className="solution-section">
      <h3>6. Non-polynomial examples</h3>
      <Examples examples={data.examples} />
    </section>
    <Part2 />
    <section className="solution-section" aria-labelledby="hand-worked-title">
      <h3 id="hand-worked-title">Hand-worked solutions</h3>
      <object className="hand-worked-pdf" data={`${import.meta.env.BASE_URL}assignment1/hand-worked-solutions.pdf#view=FitH`} type="application/pdf" aria-label="Hand-worked solutions PDF">
        <div className="hand-worked-pages" tabIndex="0" role="region" aria-label="Scrollable hand-worked solutions">
          {Array.from({ length: 7 }, (_, i) => <img key={i} src={`${import.meta.env.BASE_URL}assignment1/hand-worked/page-${i + 1}.png`} alt={`Hand-worked solutions, page ${i + 1} of 7`} />)}
        </div>
      </object>
    </section>
  </article>;
}
