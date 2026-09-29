import M from './Math.jsx';
import { fixed, scientific, NewtonTable, GoldenTable } from './WorkedSolutions.jsx';

const proofs = [
  <><M block>{String.raw`D'(x)=x^3+4x-4,\qquad D''(x)=3x^2+4>0`}</M><p>The derivative changes sign between −2 and 2. Strict convexity and growth at infinity prove a unique global minimum.</p></>,
  <><M block>{String.raw`D(x)=x^2+(x^2-2)^2=x^4-3x^2+4`}</M><M block>{String.raw`D'(x)=2x(2x^2-3)=0\quad\Longrightarrow\quad x=0,\;x=\pm\sqrt{3/2}`}</M><M block>{String.raw`D''(0)=-6,\qquad D''(\pm\sqrt{3/2})=12>0`}</M><M block>{String.raw`Q^*=(\pm\sqrt{3/2},3/2),\qquad d_{\min}=\sqrt{7}/2\approx1.322876`}</M><p>These are all stationary points, and D tends to infinity at both ends. Comparing D(0) = 4 with D(±√(3/2)) = 7/4 proves two equal global minima. A single golden-section search across both wells is not justified. Each interval below contains one minimum and is unimodal; convexity on the entire interval is not required. Starting Newton at zero satisfies stationarity but finds a local maximum.</p></>,
  <><M block>{String.raw`D(x)=x^2+e^{2x},\quad D'(x)=2x+2e^{2x},\quad D''(x)=2+4e^{2x}>0`}</M><p>The derivative is negative at −2 and positive at 1. Coercivity and strict convexity establish the unique global minimum.</p></>,
  <><M block>{String.raw`D(x)=x^2+(\ln x)^2,\quad D'(x)=2x+\frac{2\ln x}{x}`}</M><M block>{String.raw`D''(x)=2+\frac{2(1-\ln x)}{x^2}\ge 2-e^{-3}>0`}</M><p>For x ≤ e, the extra term is nonnegative. For x &gt; e, (ln x − 1)/x² has maximum 1/(2e³), attained at e³ᐟ². The derivative changes sign on [0.2, 2], and D tends to infinity as x → 0⁺ or x → ∞. The minimum is global on the logarithm’s domain.</p></>,
  <><M block>{String.raw`D(x)=x^2+x^{-2},\quad D'(x)=2x-2x^{-3},\quad D''(x)=2+6x^{-4}>0`}</M><M block>{String.raw`x^4=1,\quad x>0\;\Longrightarrow\;x^*=1,\quad Q^*=(1,1),\quad d_{\min}=\sqrt2`}</M><p>This search is restricted to the positive branch. D diverges at 0⁺ and infinity, and its derivative changes sign on [0.2, 3]. On the full domain x ≠ 0, (−1, −1) is an equally close global minimizer.</p></>,
];

export default function Examples({ examples }) {
  return <>{examples.map((e, i) => <article className="extra-example" key={e.label}>
    <h4>{e.label}: <M>{`f(x)=${e.formula}`}</M>, P = ({e.point.join(', ')})</h4>
    <p><strong>Domain:</strong> {e.domain}. <strong>Newton starts:</strong> {e.starts.join(', ')}. <strong>Golden intervals:</strong> {e.intervals.map(v => `[${v.join(', ')}]`).join(' and ')}.</p>
    {proofs[i]}
    <div className="table-scroll" tabIndex="0" role="region" aria-label={`${e.label} results`}><table>
      <caption>Numerical results for {e.label.toLowerCase()}</caption>
      <thead><tr>{['Method / start', 'Closest or stationary point Q', 'Distance', 'Interpretation'].map(v => <th scope="col" key={v}>{v}</th>)}</tr></thead>
      <tbody>
        {e.newton.map((n, j) => <tr key={`n${j}`}><th scope="row">Newton / {e.starts[j]}</th><td>({fixed(n.x, 6)}, {fixed(n.y, 6)})</td><td>{fixed(n.distance, 6)}</td><td>{n.converged ? n.classification : n.status}; |D′| = {scientific(n.residual)}</td></tr>)}
        {e.golden.map((g, j) => <tr key={`g${j}`}><th scope="row">Golden / [{e.intervals[j].join(', ')}]</th><td>({fixed(g.x, 6)}, {fixed(g.y, 6)})</td><td>{fixed(g.distance, 6)}</td><td>{g.status} Width {scientific(g.width)}</td></tr>)}
      </tbody>
    </table></div>
    <p>{e.scope}</p>
    <details><summary>Iterations for this example</summary>
      {e.newton.map((n, j) => <div key={`n${j}`}><h5>Newton, starting estimate {e.starts[j]}</h5><NewtonTable result={n} /></div>)}
      {e.golden.map((g, j) => <div key={`g${j}`}><h5>Golden-section, interval [{e.intervals[j].join(', ')}]</h5><GoldenTable result={g} /></div>)}
    </details>
  </article>)}</>;
}
