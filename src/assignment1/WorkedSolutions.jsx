import M from './Math.jsx';

export const fixed = (x, digits = 9) => (Math.abs(x) < .5 * 10 ** -digits ? 0 : x).toFixed(digits);
export const scientific = x => x.toExponential(2);
export const pointName = c => `(${c.point.join(', ')})`;
const q = x => `(${fixed(x.x, 6)}, ${fixed(x.y, 6)})`;

export function PointWork({ caseData: c, selected, children }) {
  return <div className={`point-work ${selected ? '' : 'inactive-point'}`}>
    <h4>Point P = {pointName(c)}</h4>{children}
  </div>;
}

export function Plot({ index, kind, caption }) {
  return <figure className={`scientific-figure ${kind}`}>
    <div className="plot-frame" tabIndex="0" role="region" aria-label={`${kind} plot`}><img src={`${import.meta.env.BASE_URL}assignment1/plots/${index}-${kind}.svg`} alt={caption} width={kind === 'geometry' ? 600 : 900} height={kind === 'geometry' ? 500 : 400} /></div>
    <figcaption>{caption}</figcaption>
  </figure>;
}

export function AnalyticalWork({ c }) {
  const x0 = c.point[0], a = c.analytical;
  const constant = x0 < 0 ? `+${-x0}` : x0 > 0 ? `-${x0}` : '';
  return <>
    <p className="calculation-note"><small><em>*Note: The cubic equations were solved using Wolfram Alpha.</em></small></p>
    <M block>{String.raw`2x^3+11x${constant}=0`}</M>
    {x0 === 0 ? <M block>{String.raw`x(2x^2+11)=0 \quad\Longrightarrow\quad x^*=0`}</M> :
      <M block>{String.raw`x^*\approx ${fixed(a.x)}`}</M>}
    <M block>{String.raw`Q^*=(x^*,(x^*)^2+5)\approx\left(${fixed(a.x)},\;(${fixed(a.x)})^2+5\right)\approx\left(${fixed(a.x)},\;${fixed(a.y)}\right)`}</M>
    <M block>{String.raw`d_{\min}=\sqrt{(x^*-(${x0}))^2+((x^*)^2+5)^2}\approx\sqrt{(${fixed(a.x)}-(${x0}))^2+(${fixed(a.y)})^2}\approx ${fixed(a.distance, 6)}`}</M>
  </>;
}

export function NewtonTable({ result }) {
  return <div className="table-scroll" tabIndex="0" role="region" aria-label="Newton iteration table">
    <table><caption>Newton history. D and both derivatives are evaluated at the current estimate; D(next) uses the accepted next estimate.</caption>
      <thead><tr>{['k', 'Current x⁽ᵏ⁾', 'D′', 'D″', 'Next x⁽ᵏ⁺¹⁾', 'D(current)', 'D(next)'].map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
      <tbody>{result.history.map(r => <tr key={r.k}><th scope="row">{r.k}</th><td>{fixed(r.x)}</td><td>{scientific(r.first)}</td><td>{fixed(r.second, 6)}</td><td>{fixed(r.next)}</td><td>{fixed(r.D)}</td><td>{fixed(r.next_D)}</td></tr>)}</tbody>
    </table>
  </div>;
}

export function NewtonWork({ c, index }) {
  const n = c.newton, x0 = c.point[0];
  return <>
    {x0 === 0 ? <><M block>{String.raw`D'(x^{(0)})=D'(0)=0,\qquad D''(0)=22>0`}</M><p>The starting estimate is already the unique minimum. No Newton update is needed; the table records this stationarity check as row 0.</p></> : <>
      <p>Starting from <M>{'x^{(0)}=0'}</M>, the first two accepted updates are:</p>
      {n.history.slice(0, 2).map(r => <div key={r.k} className="worked-step">
        <M block>{String.raw`x^{(${r.k + 1})}\approx ${fixed(r.x)}-\frac{2(${fixed(r.x)})^3+11(${fixed(r.x)})-(${x0})}{6(${fixed(r.x)})^2+11}`}</M>
        <M block>{String.raw`\phantom{x^{(${r.k + 1})}}\approx ${fixed(r.x)}-\frac{${fixed(r.first / 2)}}{${fixed(r.second / 2)}}\approx ${fixed(r.next)}`}</M>
      </div>)}
    </>}
    <p className="result-line">{n.status} Final <M>{String.raw`x\approx ${fixed(n.x)}`}</M>, Q ≈ {q(n)}, d ≈ <strong>{fixed(n.distance, 6)}</strong>. Residual |D′| = {scientific(n.residual)}; D″ = {fixed(n.curvature, 6)} &gt; 0.</p>
    <Plot index={index} kind="newton" caption={`Newton for P = ${pointName(c)}: estimates on D(x), with a separate iteration trace to distinguish steps near the minimum. The table preserves every accepted estimate.`} />
    <details><summary>Complete Newton table ({n.history.length} rows)</summary><NewtonTable result={n} /></details>
  </>;
}

export function GoldenTable({ result }) {
  return <div className="table-scroll" tabIndex="0" role="region" aria-label="Golden-section iteration table">
    <table><caption>Golden-section history. Each row shows the interval before comparison and the retained interval afterward. Display values are rounded; decisions use full precision.</caption>
      <thead><tr>{['k', 'a', 'b', 'u', 'v', 'D(u)', 'D(v)', 'Width', 'Compare', 'Retained [a, b]'].map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
      <tbody>{result.history.map(r => <tr key={r.k}><th scope="row">{r.k}</th>{['a', 'b', 'u', 'v', 'Du', 'Dv'].map(key => <td key={key}>{fixed(r[key])}</td>)}<td>{scientific(r.width)}</td><td>{r.comparison}</td><td>[{fixed(r.retained_a)}, {fixed(r.retained_b)}]</td></tr>)}</tbody>
    </table>
  </div>;
}

export function GoldenWork({ c, index }) {
  const g = c.golden, x0 = c.point[0];
  return <>
    <p>For this point, <M>{String.raw`D(x)=(x-(${x0}))^2+(x^2+5)^2`}</M>. Begin with [−2, 2].</p>
    {g.history.slice(0, 2).map(r => <div className="worked-step" key={r.k}>
      <h5>Interval update {r.k + 1}</h5>
      <M block>{String.raw`u=${fixed(r.b, 6)}-r(${fixed(r.b, 6)}-(${fixed(r.a, 6)}))\approx ${fixed(r.u)}`}</M>
      <M block>{String.raw`v=${fixed(r.a, 6)}+r(${fixed(r.b, 6)}-(${fixed(r.a, 6)}))\approx ${fixed(r.v)}`}</M>
      <M block>{String.raw`D(u)\approx(${fixed(r.u)}-(${x0}))^2+((${fixed(r.u)})^2+5)^2\approx ${fixed(r.Du)}`}</M>
      <M block>{String.raw`D(v)\approx(${fixed(r.v)}-(${x0}))^2+((${fixed(r.v)})^2+5)^2\approx ${fixed(r.Dv)}`}</M>
      <p>Since <M>{`D(u) ${r.comparison} D(v)`}</M>, retain {r.comparison === '<' ? '[a, v]' : r.comparison === '>' ? '[u, b]' : '[u, v]'} ≈ [{fixed(r.retained_a)}, {fixed(r.retained_b)}].</p>
    </div>)}
    <M block>{String.raw`x^*\approx\frac{a_{\rm final}+b_{\rm final}}{2}\approx\frac{${fixed(g.a, 10)}+(${fixed(g.b, 10)})}{2}\approx ${fixed(g.x)}`}</M>
    <p className="result-line">{g.status} After {g.history.length} interval updates, width = {scientific(g.width)} ≤ 10⁻⁷. Q ≈ {q(g)}; d ≈ <strong>{fixed(g.distance, 6)}</strong>.</p>
    <Plot index={index} kind="golden" caption={`Golden-section search for P = ${pointName(c)}: retained intervals approach the minimizer. The logarithmic width plot shows every contraction and the stopping threshold.`} />
    <details><summary>Complete golden-section table ({g.history.length} updates)</summary><GoldenTable result={g} /></details>
  </>;
}
