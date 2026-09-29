import { useEffect, useRef, useState } from 'react';
import M from '../assignment1/Math.jsx';
import data from '../assignment1/results.json';
import pythonSource from '../../scripts/assignment1.py?raw';
import Examples from '../assignment1/Examples.jsx';
import { AnalyticalWork, NewtonWork, GoldenWork, PointWork, Plot, fixed, pointName } from '../assignment1/WorkedSolutions.jsx';
import '../assignment1/assignment.css';

const sections = [['problem', 'Problem'], ['analytical', 'Analytical'], ['newton', 'Newton–Raphson'], ['golden', 'Golden-section'], ['comparison', 'Results'], ['examples', 'Examples & Python']];

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
  const downloadBase = `${import.meta.env.BASE_URL}assignment1/`;
  return <article className="assignment-one" ref={article}>
    <div className="part-heading"><h3>Part 1 · Distance from a curve</h3><button type="button" className="print-button" onClick={() => window.print()}>Print full solution</button></div>
    <nav className="section-nav" aria-label="Part 1 sections">
      {sections.map(([id, label]) => <button type="button" key={id} onClick={() => { const target = document.getElementById(id); target.scrollIntoView(); target.focus({ preventScroll: true }); }}>{label}</button>)}
    </nav>

    <section id="problem" tabIndex="-1" className="solution-section">
      <h3>1. Problem and geometry</h3>
      <p>Find the shortest distance from <M>{'y=x^2+5'}</M> to each of (0, 0), (−4, 0), (−8, 0), (2, 0), and (6, 0).</p>
      <p className="print-note">Full solution: all five assigned points are included below.</p>
      <p>The given point is <M>{'P=(x_0,y_0)'}</M>, and <M>{'Q=(x,x^2+5)'}</M> is a point on the parabola. We choose x so that Q is as close as possible to P; this closest point is <M>{'Q^*'}</M>.</p>
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
      <p>Apply Newton’s root-finding method to <M>{String.raw`D'(x)=0`}</M>. Here <M>{'x^{(k)}'}</M> denotes an iterate; <M>{'x_0'}</M> remains the fixed point’s horizontal coordinate.</p>
      <M block>{String.raw`x^{(k+1)}=x^{(k)}-\frac{D'(x^{(k)})}{D''(x^{(k)})}`}</M>
      <p>For any twice-differentiable curve <M>{'y=f(x)'}</M>:</p>
      <M block>{String.raw`D'(x)=2(x-x_0)+2(f(x)-y_0)f'(x)`}</M>
      <M block>{String.raw`D''(x)=2+2[f'(x)]^2+2(f(x)-y_0)f''(x)`}</M>
      <p>For the assigned parabola, cancel the factor of 2 in numerator and denominator:</p>
      <M block>{String.raw`x^{(k+1)}=x^{(k)}-\frac{2(x^{(k)})^3+(11-2y_0)x^{(k)}-x_0}{6(x^{(k)})^2+11-2y_0}`}</M>
      <p>Use <M>{'x^{(0)}=0'}</M> in every assigned case. Stop successfully when <M>{String.raw`|D'(x^{(k)})|\le10^{-12}`}</M>, with at most 100 updates. A step ≤ 10⁻¹⁴(1 + |x|) without a small residual is reported as stagnation, not convergence. A denominator |D″| ≤ 10⁻¹⁴ stops with a failure message. Invalid evaluations raise a readable error.</p>
      <p>Newton generally finds a <em>stationary point</em>. For the assigned points, D decreases before the critical point and increases after it, making it the global minimum.</p>
      {work(NewtonWork)}
    </section>

    <section id="golden" tabIndex="-1" className="solution-section">
      <h3>4. Golden-section search</h3>
      <p>This method compares squared distances and narrows an interval without derivatives. It requires a <strong>unimodal objective on the chosen interval</strong>: decreasing toward one minimum, then increasing.</p>
      <p>For the assigned points, define <M>{'g(x)=2x^3+11x-x_0'}</M>. Then:</p>
      <M block>{String.raw`g'(x)=6x^2+11>0,\quad g(-2)=-38-x_0<0,\quad g(2)=38-x_0>0`}</M>
      <p>All assigned horizontal coordinates lie between −8 and 6, so these endpoint signs hold in every case. Therefore [−2, 2] contains every minimizer, and strict convexity makes D unimodal there.</p>
      <M block>{String.raw`r=\frac{\sqrt5-1}{2}\approx0.618033989,\qquad u=b-r(b-a),\quad v=a+r(b-a)`}</M>
      <ul className="method-rules"><li>If D(u) &lt; D(v), retain [a, v].</li><li>If D(u) &gt; D(v), retain [u, b].</li><li>If D(u) = D(v), retain [u, v]; for this strictly unimodal objective, the minimizer lies between them.</li></ul>
      <p>The usual update retains fraction r of the width and reuses one function evaluation. The equality update retains fraction 2r − 1. The code compares full-precision values; equal displayed decimals need not be equal internally.</p>
      <p>Stop once <M>{String.raw`b-a\le10^{-7}`}</M>, with a maximum of 200 updates. Use the <strong>final midpoint</strong> to calculate Q and the original distance. In exact arithmetic, an interval containing the minimizer gives midpoint error at most half its width; floating-point comparisons near the minimum add numerical uncertainty.</p>
      {work(GoldenWork)}
    </section>

    <section id="comparison" tabIndex="-1" className="solution-section">
      <h3>5. Results comparison</h3>
      <div className="table-scroll" tabIndex="0" role="region" aria-label="All assigned results"><table>
        <caption>All five assigned points. Coordinates and distances are rounded to six decimal places.</caption>
        <thead><tr>{['Point P', 'Closest point Q* (analytical)', 'Analytical d', 'Newton d', 'Golden d'].map(v => <th key={v} scope="col">{v}</th>)}</tr></thead>
        <tbody>{data.cases.map(c => <tr key={c.point[0]}><th scope="row">{pointName(c)}</th><td>({fixed(c.analytical.x, 6)}, {fixed(c.analytical.y, 6)})</td><td>{fixed(c.analytical.distance, 6)}</td><td>{fixed(c.newton.distance, 6)}</td><td>{fixed(c.golden.distance, 6)}</td></tr>)}</tbody>
      </table></div>
      <p>All three approaches agree with the supplied reference distances to six decimal places. The verification suite also checks curve membership, stationarity, interval contraction, and coordinate agreement (Newton within 10⁻¹⁰; golden-section within 10⁻⁷ of the analytical root).</p>
    </section>

    <section id="examples" tabIndex="-1" className="solution-section">
      <h3>6. Other curves and reusable Python</h3>
      <p>The functions accept a point and a callable f; Newton additionally needs f′ and f″. For a general parabola, <code>parabola(a, b, c)</code> returns these three functions for <M>{'f(x)=ax^2+bx+c'}</M>.</p>
      <M block>{String.raw`f'(x)=2ax+b,\qquad f''(x)=2a`}</M>
      <p>For other points and curves, check the domain, all possible stationary points, and any boundary behavior before claiming a global shortest distance. Multiple starts alone do not prove that all minima have been found.</p>
      <Examples examples={data.examples} />
      <h4>Run and reproduce</h4>
      <p>These are <strong>precomputed Python results</strong>; changing the point selector displays a different saved calculation. No optimizer runs in JavaScript. The numerical script uses only the Python 3.10+ standard library. The separate plot generator requires Matplotlib.</p>
      <div className="downloads"><a href={`${downloadBase}solution.py`} download>Download Python source</a><a href={`${downloadBase}results.json`} download>Download results & histories (JSON)</a></div>
      <p>Run the standalone download:</p><pre><code>python3 solution.py --output results.json</code></pre>
      <p>Or regenerate this repository’s data and plots:</p><pre><code>{`python3 scripts/assignment1.py\npython3 -m pip install -r requirements-plots.txt\npython3 scripts/generate_plots.py\npython3 -m unittest discover -s tests -p 'test_*.py'\nnpm run dev`}</code></pre>
      <h5>Use another function or parabola</h5>
      <pre><code>{`from solution import parabola, newton, golden_section, NumericalError\n\nf, df, ddf = parabola(a=0.5, b=0, c=1)\ntry:\n    n = newton(f, df, ddf, point=(2, 0), start=0)\n    g = golden_section(f, point=(2, 0), a=-2, b=2)\n    for answer in (n, g):\n        if not answer['converged']:\n            raise RuntimeError(answer['status'])\n        print(answer['x'], answer['y'], answer['distance'])\nexcept (NumericalError, ValueError, RuntimeError) as error:\n    print(f'Calculation failed: {error}')`}</code></pre>
      <p>Replace f, df, and ddf with your own callables for other curves. Select a valid domain and justify the golden-section interval. Newton does not automatically constrain an iterate to a function’s domain. See the examples above for successful starts and intervals.</p>
      <details className="source-details"><summary>Complete runnable Python source</summary><pre><code>{pythonSource}</code></pre></details>
    </section>
  </article>;
}
