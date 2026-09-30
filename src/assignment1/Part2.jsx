import { useState } from 'react';
import M from './Math.jsx';
import { fixed, Plot } from './WorkedSolutions.jsx';
import data from './fitting-results.json';

const equations = [String.raw`\hat y=2.3x-0.2`, String.raw`\hat y=0.75x^2+0.05x+0.55`];
const matrix = rows => String.raw`\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\end{bmatrix}`;

function Analytical({ model: m }) {
  const line = m.degree === 1;
  return <>
    <h4>Analytical solution</h4>
    {line ? <>
      <M block>{String.raw`\frac{\partial E}{\partial m}=\frac12\sum_i x_i(mx_i+b-y_i)=\frac12(14m+6b-31)=0`}</M>
      <M block>{String.raw`\frac{\partial E}{\partial b}=\frac12\sum_i(mx_i+b-y_i)=\frac12(6m+4b-13)=0`}</M>
      <M block>{String.raw`14m+6b=31,\qquad6m+4b=13`}</M>
      <M block>{String.raw`2(14m+6b)-3(6m+4b)=62-39\quad\Rightarrow\quad10m=23`}</M>
      <M block>{String.raw`m=2.3,\qquad b=\frac{13-6(2.3)}4=-0.2`}</M>
    </> : <>
      <M block>{String.raw`\frac{\partial E}{\partial a}=\frac12\sum_i x_i^2(ax_i^2+bx_i+c-y_i)=\frac12(98a+36b+14c-83)=0`}</M>
      <M block>{String.raw`\frac{\partial E}{\partial b}=\frac12\sum_i x_i(ax_i^2+bx_i+c-y_i)=\frac12(36a+14b+6c-31)=0`}</M>
      <M block>{String.raw`\frac{\partial E}{\partial c}=\frac12\sum_i(ax_i^2+bx_i+c-y_i)=\frac12(14a+6b+4c-13)=0`}</M>
      <M block>{String.raw`\begin{aligned}98a+36b+14c&=83&&\text{(1)}\\36a+14b+6c&=31&&\text{(2)}\\14a+6b+4c&=13&&\text{(3)}\end{aligned}`}</M>
      <M block>{String.raw`2(1)-7(3):\quad98a+30b=75`}</M>
      <M block>{String.raw`2(2)-3(3):\quad30a+10b=23`}</M>
      <M block>{String.raw`(98a+30b)-3(30a+10b)=75-69\quad\Rightarrow\quad8a=6`}</M>
      <M block>{String.raw`a=0.75,\quad b=\frac{23-30(0.75)}{10}=0.05`}</M>
      <M block>{String.raw`c=\frac{13-14(0.75)-6(0.05)}4=0.55`}</M>
    </>}
    <M block>{equations[line ? 0 : 1]}</M>
    <M block>{String.raw`E_{\min}=\frac14\left[${m.analytical.rows.map(r => `(${fixed(r.fitted, 2)}-${r.y})^2`).join('+')}\right]=${fixed(m.analytical.mse, 4)}`}</M>
    <div className="table-scroll" tabIndex="0" role="region" aria-label={`${m.label} residuals`}><table>
      <caption>Residual = fitted value − observed value.</caption>
      <thead><tr>{['x', 'Observed y', 'Fitted y', 'Residual', 'Squared residual'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{m.analytical.rows.map(r => <tr key={r.x}><th scope="row">{r.x}</th>{['y', 'fitted', 'residual', 'squared_residual'].map(k => <td key={k}>{fixed(r[k], 4)}</td>)}</tr>)}</tbody>
    </table></div>
  </>;
}

function CoordinateWise({ model: m }) {
  const r = m.sequential;
  return <section className="coordinate-newton">
    <h4>Newton–Raphson — Single-parameter updates</h4>
    <p>Update one parameter at a time, keeping the others fixed and using each new value immediately. One sweep updates all parameters.</p>
    <p>For each parameter, use its first and second derivatives to find where its first derivative is zero. This minimizes the MSE with the other parameters held fixed.</p>
    <M block>{String.raw`\theta_j^{\mathrm{new}}=\theta_j-\frac{\partial E/\partial\theta_j}{\partial^2E/\partial\theta_j^2}`}</M>
    {m.degree === 1 ? <>
      <M block>{String.raw`m_{k+1}=\frac{31-6b_k}{14},\qquad b_{k+1}=\frac{13-6m_{k+1}}4`}</M>
    </> : <>
      <M block>{String.raw`a_{k+1}=\frac{83-36b_k-14c_k}{98}`}</M>
      <M block>{String.raw`b_{k+1}=\frac{31-36a_{k+1}-6c_k}{14},\qquad c_{k+1}=\frac{13-14a_{k+1}-6b_{k+1}}4`}</M>
    </>}
    <h5>First three sweeps</h5>
    <p>Start all parameters at zero. The calculations below are rounded; Python continues to convergence.</p>
    {r.history.slice(1, 4).map(row => <div className="worked-step" key={row.iteration}>
      <h5>Sweep {row.iteration}</h5>
      {r.updates.filter(u => u.iteration === row.iteration).map(u => {
        const j = u.coordinate;
        const terms = m.gram[j].map((v, k) => k === j ? '' : `-${v}(${fixed(u.before[k], 6)})`).join('');
        const explanation = m.degree === 1
          ? ['Update the slope m while keeping the intercept b fixed.', 'Update the intercept b using the new slope m.']
          : ['Update a while keeping b and c fixed.', 'Update b using the new a, while keeping c fixed.', 'Update c using the new a and b.'];
        return <div key={j}>
          {row.iteration === 1 && <p>{explanation[j]}</p>}
          <M block>{String.raw`${m.names[j]}^{(${row.iteration})}\approx\frac{${m.rhs[j]}${terms}}{${m.gram[j][j]}}\approx${fixed(u.parameters[j], 9)}`}</M>
        </div>;
      })}
      {row.iteration === 1 && <p>Calculate the MSE after updating all parameters. Repeat this sequence because changing one parameter can change the best values of the others.</p>}
      <M block>{String.raw`E^{(${row.iteration})}\approx${fixed(row.mse, 9)}`}</M>
    </div>)}
    <p>Stop when <M>{String.raw`\|\nabla E\|_\infty<10^{-8}`}</M>, checked after each sweep, with a limit of 10,000 sweeps.</p>
    <p className="result-line">{r.converged ? `Converged after ${r.iteration} sweeps. ` : r.status}
      {m.names.map((name, j) => `${name} ≈ ${fixed(r.parameters[j], 6)}`).join(', ')}; MSE ≈ <strong>{fixed(r.mse, 6)}</strong>.</p>
    <Plot index={`part2-${m.label.toLowerCase()}-coordinate`} kind="fits" caption="Newton–Raphson with single-parameter updates: the starting fit, first three sweeps, and final fit." />
    <Plot index={`part2-${m.label.toLowerCase()}-coordinate`} kind="mse" caption="MSE after each complete sweep. The dashed line marks the analytical minimum." />
  </section>;
}

function Simultaneous({ model: m }) {
  const s = m.simultaneous;
  const terms = m.gram.map((row, i) => `${row.map((v, j) => `${v}${m.names[j]}`).join('+')}-${m.rhs[i]}`);
  return <>
    <h4>Multivariate Newton–Raphson</h4>
    <p>Update all parameters together using the gradient and Hessian. For these quadratic MSE functions, one Newton step gives the analytical solution in exact arithmetic.</p>
    <M block>{String.raw`\nabla E=\frac12${matrix(terms.map(t => [t]))},\qquad H=${matrix(m.hessian)}`}</M>
    <M block>{String.raw`H\Delta=\nabla E,\qquad\boldsymbol{\theta}_{\mathrm{new}}=\boldsymbol{\theta}-\Delta`}</M>
    <p>Start all parameters at zero, then solve for the update:</p>
    <M block>{String.raw`\boldsymbol{\theta}^{(0)}=${matrix(m.names.map(() => [0]))},\quad\nabla E(0)=${matrix(s.starting_gradient.map(v => [v]))}`}</M>
    <M block>{String.raw`\Delta=${matrix(s.delta.map(v => [fixed(v, 4)]))},\quad\boldsymbol{\theta}^{(1)}=${matrix(s.parameters.map(v => [fixed(v, 4)]))}`}</M>
    <M block>{String.raw`E(\boldsymbol{\theta}^{(1)})=${fixed(s.mse, 4)}`}</M>
  </>;
}

export default function Part2() {
  const [selected, setSelected] = useState(0);
  const m = data.models[selected];
  return <section id="part2" className="solution-section part-two" aria-labelledby="part2-title">
    <h3 id="part2-title">Part 2 · Fitting a line and parabola</h3>
    <M block>{String.raw`(0,0.5),\quad(2,3.5),\quad(1,1.5),\quad(3,7.5)`}</M>
    <p>MSE measures the average squared vertical error between each prediction and its observed value.</p>
    <M block>{String.raw`E=\frac14\sum_{i=1}^4(\hat y_i-y_i)^2`}</M>
    <div className="point-controls"><label htmlFor="model-select">Model</label><select id="model-select" value={selected} onChange={e => setSelected(Number(e.target.value))}><option value="0">Line</option><option value="1">Parabola</option></select></div>
    <div key={m.label} className="fitting-model">
      <h4>{m.label} model and objective</h4>
      {m.degree === 1 ? <>
        <M block>{String.raw`\hat y=mx+b`}</M>
        <M block>{String.raw`\begin{aligned}E(m,b)=\frac14\big[&(b-0.5)^2+(2m+b-3.5)^2\\&+(m+b-1.5)^2+(3m+b-7.5)^2\big]\end{aligned}`}</M>
      </> : <>
        <M block>{String.raw`\hat y=ax^2+bx+c`}</M>
        <p>The general parabola uses three parameters: a, b, and c.</p>
        <M block>{String.raw`\begin{aligned}E(a,b,c)=\frac14\big[&(c-0.5)^2+(4a+2b+c-3.5)^2\\&+(a+b+c-1.5)^2+(9a+3b+c-7.5)^2\big]\end{aligned}`}</M>
      </>}
      <Analytical model={m} />
      <Simultaneous model={m} />
      <h4>Results and plots</h4>
      <p className="result-line">{m.simultaneous.converged ? `Converged in ${m.simultaneous.iteration} Newton step. ` : `${m.simultaneous.status} `}
        {m.names.map((name, j) => `${name} ≈ ${fixed(m.simultaneous.parameters[j], 6)}`).join(', ')}; MSE ≈ <strong>{fixed(m.simultaneous.mse, 6)}</strong>.</p>
      <Plot index={`part2-${m.label.toLowerCase()}`} kind="fits" caption={`${m.label}: starting fit and the fit after one Newton step alongside the observed data.`} />
      <Plot index={`part2-${m.label.toLowerCase()}`} kind="mse" caption="MSE before and after the Newton update. The dashed line marks the analytical minimum." />
      <CoordinateWise model={m} />
    </div>
    <h4>Final comparison</h4>
    <div className="table-scroll" tabIndex="0" role="region" aria-label="Final fitted models"><table>
      <caption>Minimum MSE for each model.</caption>
      <thead><tr><th scope="col">Model</th><th scope="col">Fitted equation</th><th scope="col">Minimum MSE</th></tr></thead>
      <tbody>{data.models.map((model, i) => <tr key={model.label}><th scope="row">{model.label}</th><td><M>{equations[i]}</M></td><td>{fixed(model.analytical.mse, 4)}</td></tr>)}</tbody>
    </table></div>
  </section>;
}
