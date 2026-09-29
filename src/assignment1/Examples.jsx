import { useState } from 'react';
import M from './Math.jsx';
import { fixed, NewtonTable, GoldenTable, Plot } from './WorkedSolutions.jsx';

export default function Examples({ examples, pythonSource }) {
  const [selected, setSelected] = useState(0);
  const e = examples[selected];
  const n = e.newton[0], g = e.golden[0];
  const complete = n.converged && g.converged;
  const base = `${import.meta.env.BASE_URL}assignment1/`;
  const rows = [
    ['Newton–Raphson', n, n.history.filter(r => r.action === 'Accepted update.').length],
    ['Golden-section', g, g.history.length],
  ];

  return <>
    <div className="point-controls example-controls">
      <label htmlFor="example-select">Example</label>
      <select id="example-select" value={selected} onChange={event => setSelected(Number(event.target.value))}>
        {examples.map((example, i) => <option key={example.label} value={i}>{example.label}</option>)}
      </select>
    </div>
    <div key={e.label} className="non-polynomial-example">
      <h4><M>{`f(x)=${e.formula}`}</M>, <M>{'P=(0,0)'}</M></h4>
      <p>The same numerical routines are reused with a different function and, for Newton–Raphson, its derivatives.</p>
      {e.domain === 'x > 0' && <p>Domain: x &gt; 0.</p>}
      <p className="calculation-note"><small>Newton starting guess: {e.starts[0]}. Golden-section interval: [{e.intervals[0].join(', ')}].</small></p>
      {complete && <Plot index={`example-${selected}`} kind="geometry" caption={`${e.label}: the segment joins P to the closest point Q*. Both axes use the same scale.`} />}
      <div className="table-scroll" tabIndex="0" role="region" aria-label="Non-polynomial results">
        <table>
          <caption>{e.label} results</caption>
          <thead><tr><th scope="col">Method</th><th scope="col">Closest point Q*</th><th scope="col">Distance</th><th scope="col">Iterations</th></tr></thead>
          <tbody>{rows.map(([label, answer, count]) => <tr key={label}>
            <th scope="row">{label}</th>
            {answer.converged ? <><td>({fixed(answer.x, 6)}, {fixed(answer.y, 6)})</td><td>{fixed(answer.distance, 6)}</td><td>{count}</td></> :
              <td colSpan="3" role="status">{answer.error ? 'The function could not be evaluated. Check its domain.' : 'No solution found within the calculation limits.'}</td>}
          </tr>)}</tbody>
        </table>
      </div>
      {complete && <>
        <Plot index={`example-${selected}`} kind="newton" caption="Newton–Raphson: the estimates approach the closest point’s x-coordinate." />
        <Plot index={`example-${selected}`} kind="golden" caption="Golden-section search: the interval narrows around the closest point’s x-coordinate." />
      </>}
      <details><summary>Iteration tables</summary>
        <h5>Newton–Raphson</h5><NewtonTable result={n} />
        <h5>Golden-section search</h5><GoldenTable result={g} />
      </details>
      <details><summary>Python code</summary>
        <p>Save the downloaded source as <code>solution.py</code>, then run this example alongside it.</p>
        <div className="downloads"><a href={`${base}solution.py`} download>Download Python source</a><a href={`${base}results.json`} download>Download results &amp; histories (JSON)</a></div>
        <pre><code>{e.code}</code></pre>
        <details className="source-details"><summary>Shared numerical routines and source</summary><pre><code>{pythonSource}</code></pre></details>
      </details>
    </div>
  </>;
}
