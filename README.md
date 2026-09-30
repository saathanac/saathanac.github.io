# SYDE 572 Assignments Website

React + Vite website for Pattern Recognition assignments. Five assignment tabs
are available; Assignment 1 contains **Part 1 (distance from a curve)** and **Part 2 (line and parabola fitting)**.

## Run locally

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal. Assignment 1 is at `/#/assignments/1`.
Use the development server instead of opening `index.html` directly.

## Assignment 1: shortest distance from a curve

The page includes the symbolic derivation, cubic roots noted as solved using Wolfram Alpha, worked Newton and
golden-section updates for all five points, complete iteration tables, equal-scale
geometry plots, method plots, and a comparison of all three answers. Select a
point to change the worked calculations and figures. The non-polynomial section uses a selector for exponential and logarithmic curves,
with comparison results, geometry and iteration plots, and expandable histories. Python code is available in the repository.

Numerical calculations are **precomputed in Python**, not performed by JavaScript.
The page imports the generated JSON. The numerical script has no external dependencies
and supports Python 3.10+. It implements both algorithms directly, including input
validation, failure statuses, and full iteration histories.

### Regenerate results

```sh
python3 scripts/assignment1.py
```

This updates:

- `src/assignment1/results.json` — data consumed by React.
- `public/assignment1/results.json` — downloadable full-precision results and histories.
- `public/assignment1/solution.py` — standalone copy of the numerical source.

The downloaded script also runs independently:

```sh
python3 solution.py --output results.json
```

Import `parabola`, `newton`, and `golden_section` from the script for other curves.
Newton returns a stationary point; inspect `converged`, `status`, and `classification`.
Golden-section requires a unimodal objective on the supplied interval. Domain/evaluation
errors raise `NumericalError`; iteration limits, near-zero denominators, and stagnation
return `converged=False`. Neither routine proves global optimality for an arbitrary curve.
The page supplies the global-minimum arguments for its examples.

### Regenerate plots

Matplotlib is required only for the 21 standalone SVG figures. A virtual environment
keeps this dependency separate from the numerical implementation:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-plots.txt
python scripts/assignment1.py
python scripts/generate_plots.py
```

Figures are generated from the same JSON as the tables into `public/assignment1/plots/`.
Regenerate both data and plots after changing a numerical example. To update only
the non-polynomial figures, run `python scripts/generate_plots.py --examples-only`. SVG output uses a
fixed hash seed and omits generation dates for reproducible artifacts.

### Verification

```sh
npm run test:numerics
npm run test:ui
npm run build
```

The numerical tests use only the Python standard library. They check the reference
distances, an independent bisection cross-check, curve membership, perpendicularity,
stationarity, golden-section contraction, accepted iterates, failure handling,
the multiple-minimum example, and consistency of generated files.

Browser tests use Playwright and a locally installed Google Chrome (`channel: 'chrome'`).
They launch a local Vite server on port 5174 and check all five selections, math,
plots, tables, assignment navigation, downloads, mobile overflow, and print behavior.
Install Chrome before running them if it is not present. Test artifacts are ignored
by Git and saved under `test-results/`.

The **Print full solution** button includes all five points and opens normally collapsed
tables for printing. Browser Print → Save as PDF also works. This is
intentionally a full solution, so the printout is long. Source and tables return to
their original collapsed state afterward.

## Editing assignments

Edit `src/pages/Assignment1.jsx` for Part 1, with its helpers in `src/assignment1/`.
Edit `scripts/assignment1.py` for numerical behavior. Assignments 2–5 remain separate
placeholder components in `src/pages/`. Shared site styling is in `src/styles.css`;
Part 1 and print styles are in `src/assignment1/assignment.css`.

Math uses locally bundled [KaTeX](https://katex.org/docs/api) with accessible MathML.
Plots, fonts, source, and data are served locally; no CDN is required.

## Production build and hosting

```sh
npm run build
npm run preview
```

The build is written to `dist/`. Hash routes support direct links on GitHub Pages.
The existing deployment workflow runs on pushes to `main` when the repository's
Pages source is **GitHub Actions**. Building locally does not deploy the site.
Part 2 is implemented below Part 1 on the same assignment page.

### Non-polynomial verification

The exponential example uses P=(0,0), Newton start 0, and interval [-2,1].
The logarithmic example uses P=(0,0), Newton start 1, and interval [0.1,2];
all three logarithmic callables reject x <= 0. Both use the existing tolerances.
The example code saved in the generated JSON is assembled from the same function definitions and settings
used to produce the JSON, and is executed in the numerical tests.

For the exponential squared distance, D″=2+4 exp(2x)>0 on the real line.
For the logarithm, D″=2+2(1-ln x)/x² >= 2-exp(-3)>0 on x>0; the bound follows
by maximizing (ln x-1)/x² at exp(3/2). Each objective diverges at both domain ends.
Tests check opposite derivative signs at the specified interval endpoints, then
independently bisect the unique stationary root and compare both methods with it.
These checks establish that the selected intervals contain the unique global minima.

## Assignment 1, Part 2: line and parabola fitting

The Line/Parabola selector shows each model’s objective, analytical calculations,
residual table, and simultaneous multivariate Newton–Raphson calculation. Newton
updates all parameters together by solving HΔ=gradient with pivoted elimination;
it does not form an inverse or use a library optimizer. Starting from zero, both
quadratic objectives reach their analytical solutions in one step in exact arithmetic.

The plots show the starting fit, the fit after one Newton step, and the MSE before
and after that update. Part 1 is preserved. Printing includes the selected Part 2
model and the comparison of both models. Code and generated data remain in the repo.

Regenerate Part 2:

```sh
python3 scripts/assignment1_part2.py
# Use the existing plotting environment / requirements-plots.txt.
python3 scripts/generate_fitting_plots.py
```

The numerical script uses the Python standard library. It writes
`src/assignment1/fitting-results.json`, `public/assignment1/fitting-results.json`,
and the standalone copy `public/assignment1/fitting.py`.

`simultaneous_newton(points, degree, start=None, tolerance=1e-8)` records the initial
and final parameters, MSE, gradient, Hessian, and update vector. It checks the final
gradient and reports a clear status if the tolerance is not met.

The line parameters are (2.3, -0.2), with MSE 0.575. The parabola parameters are
(0.75, 0.05, 0.55), with MSE 0.0125. Tests verify normal equations, positive-definite
Hessians, the one-step update from zero and other starts, decreasing MSE, plot samples,
failure handling, and generated-file consistency. Run `npm run test:numerics`,
`npm run test:ui`, and `npm run build` for verification.
