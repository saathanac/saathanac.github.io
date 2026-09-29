"""SYDE 572 Assignment 1, Part 1. Python 3.10+; standard library only."""
import argparse
import inspect
import json
import math
from pathlib import Path


class NumericalError(ValueError):
    """A function or objective could not be evaluated as a finite real value."""


def finite(value, label):
    try:
        value = float(value)
    except (ValueError, TypeError, OverflowError) as exc:
        raise NumericalError(f'{label} must be a finite real number.') from exc
    if not math.isfinite(value):
        raise NumericalError(f'{label} must be finite.')
    return value


def evaluate(function, x, label='f'):
    try:
        return finite(function(x), f'{label}({x:g})')
    except (ValueError, TypeError, ArithmeticError) as exc:
        raise NumericalError(f'Cannot evaluate {label} at x={x:g}: {exc}') from exc


def validate(point, tolerance, max_iter):
    if not isinstance(point, (tuple, list)) or len(point) != 2:
        raise ValueError('point must contain exactly (x0, y0).')
    point = tuple(finite(v, 'point coordinate') for v in point)
    if finite(tolerance, 'tolerance') <= 0:
        raise ValueError('tolerance must be positive.')
    if isinstance(max_iter, bool) or not isinstance(max_iter, int) or max_iter < 1:
        raise ValueError('max_iter must be a positive integer.')
    return point


def objective(f, point, x):
    y = evaluate(f, x)
    try:
        return finite((x - point[0])**2 + (y - point[1])**2, 'squared distance')
    except OverflowError as exc:
        raise NumericalError('Squared distance overflowed; choose a smaller search region.') from exc


def derivatives(f, df, ddf, point, x):
    y, dy, ddy = evaluate(f, x), evaluate(df, x, "f'"), evaluate(ddf, x, "f''")
    try:
        first = 2 * (x - point[0]) + 2 * (y - point[1]) * dy
        second = 2 + 2 * dy**2 + 2 * (y - point[1]) * ddy
        return finite(first, "D'"), finite(second, "D''")
    except OverflowError as exc:
        raise NumericalError('Distance derivatives overflowed.') from exc


def result(f, point, x, history, converged, status, **extra):
    squared = objective(f, point, x)
    return dict(x=x, y=evaluate(f, x), squared_distance=squared,
                distance=math.sqrt(squared), converged=converged, status=status,
                history=history, **extra)


def newton(f, df, ddf, point, start=0.0, residual_tol=1e-12,
           step_tol=1e-14, denominator_tol=1e-14, max_iter=100):
    """Find a stationary point of squared distance, not necessarily a minimum.

    Success requires |D'| <= residual_tol. A tiny step alone is not success.
    Invalid evaluations raise NumericalError; algorithmic failures return
    converged=False with a status and the last accepted iterate. Check both!
    """
    residual_tol = finite(residual_tol, 'residual_tol')
    step_tol = finite(step_tol, 'step_tol')
    denominator_tol = finite(denominator_tol, 'denominator_tol')
    point = validate(point, residual_tol, max_iter)
    for name, value in [('step_tol', step_tol), ('denominator_tol', denominator_tol)]:
        if finite(value, name) <= 0:
            raise ValueError(f'{name} must be positive.')
    x = finite(start, 'start')
    history = []
    status, converged = 'Maximum iterations reached.', False
    for k in range(max_iter):
        first, second = derivatives(f, df, ddf, point, x)
        row = dict(k=k, x=x, first=first, second=second, D=objective(f, point, x))
        if abs(first) <= residual_tol:
            history.append(dict(row, next=x, next_D=row['D'], action='Already stationary; no update.'))
            converged, status = True, 'Stationarity tolerance met.'
            break
        if abs(second) <= denominator_tol:
            history.append(dict(row, next=x, next_D=row['D'], action='Stopped: near-zero denominator.'))
            status = 'Near-zero D\'\'; Newton update is undefined or unstable.'
            break
        candidate = finite(x - first / second, 'Newton candidate')
        candidate_D = objective(f, point, candidate)
        next_first, _ = derivatives(f, df, ddf, point, candidate)
        history.append(dict(row, next=candidate, next_D=candidate_D, action='Accepted update.'))
        step = abs(candidate - x)
        x = candidate  # All returned quantities use this final accepted iterate.
        if abs(next_first) <= residual_tol:
            converged, status = True, 'Stationarity tolerance met.'
            break
        if step <= step_tol * (1 + abs(x)):
            status = 'Step stagnated before stationarity tolerance was met.'
            break
    first, second = derivatives(f, df, ddf, point, x)
    classification = ('local minimum' if second > 0 else 'local maximum' if second < 0
                      else 'inconclusive second derivative') if converged else 'not classified'
    return result(f, point, x, history, converged, status,
                  residual=abs(first), curvature=second, classification=classification)


def golden_section(f, point, a, b, width_tol=1e-7, max_iter=200):
    """Minimize squared distance on [a,b], assuming it is unimodal there.

    The caller must justify unimodality and the search domain. Equal interior
    values retain [u,v]. Convergence certifies width, not global optimality.
    """
    width_tol = finite(width_tol, 'width_tol')
    point = validate(point, width_tol, max_iter)
    a, b = finite(a, 'a'), finite(b, 'b')
    if a >= b:
        raise ValueError('The interval must satisfy a < b.')
    finite(b - a, 'interval width')
    objective(f, point, a)
    objective(f, point, b)
    r = (math.sqrt(5) - 1) / 2
    u, v = b - r * (b - a), a + r * (b - a)
    du, dv = objective(f, point, u), objective(f, point, v)
    history = []
    status = 'Maximum iterations reached.'
    for k in range(max_iter):
        if b - a <= width_tol:
            break
        old_a, old_b = a, b
        row = dict(k=k, a=a, b=b, u=u, v=v, Du=du, Dv=dv, width=b-a)
        if du < dv:
            b, v, dv = v, u, du
            u = b - r * (b - a)
            du = objective(f, point, u)
            comparison = '<'
        elif du > dv:
            a, u, du = u, v, dv
            v = a + r * (b - a)
            dv = objective(f, point, v)
            comparison = '>'
        else:
            a, b = u, v
            u, v = b - r * (b - a), a + r * (b - a)
            du, dv = objective(f, point, u), objective(f, point, v)
            comparison = '='
        history.append(dict(row, retained_a=a, retained_b=b, comparison=comparison))
        if not (b - a < old_b - old_a):
            status = 'Interval stagnated at floating-point resolution.'
            break
    converged = b - a <= width_tol
    if converged:
        status = 'Interval-width tolerance met.'
    return result(f, point, a + (b - a) / 2, history, converged, status,
                  a=a, b=b, width=b-a)


def parabola(a=1.0, b=0.0, c=5.0):
    """Return (f, f', f'') for ax²+bx+c; a=0 also supports a line."""
    a, b, c = (finite(v, 'coefficient') for v in (a, b, c))
    return (lambda x: a*x*x+b*x+c, lambda x: 2*a*x+b, lambda x: 2*a)


def real_cbrt(value):
    return math.copysign(abs(value)**(1/3), value)


def analytical(x0):
    """Cardano formula for y=x²+5 and y0=0 only."""
    radical = math.sqrt(x0*x0/16 + 1331/216)
    x = real_cbrt(x0/4 + radical) + real_cbrt(x0/4 - radical)
    f, _, _ = parabola()
    return dict(x=x, y=f(x), distance=math.hypot(x-x0, f(x)),
                squared_distance=objective(f, (x0, 0), x), radical=radical,
                cube_plus=x0/4+radical, cube_minus=x0/4-radical)


def samples(f, left, right, count=241):
    return [[x, evaluate(f, x)] for x in (left+(right-left)*i/(count-1) for i in range(count))]


def exponential_functions():
    return math.exp, math.exp, math.exp


def logarithmic_functions():
    def positive(x):
        if x <= 0:
            raise NumericalError('The logarithm requires x > 0.')
        return x

    def f(x):
        return math.log(positive(x))

    def df(x):
        return 1 / positive(x)

    def ddf(x):
        return -1 / positive(x)**2

    return f, df, ddf


def example(label, formula, domain, factory, start, interval):
    f, df, ddf = factory()
    point = (0, 0)

    def attempt(calculate):
        try:
            answer = calculate()
        except (ValueError, ArithmeticError) as error:
            return dict(converged=False, status='The function could not be evaluated. Check its domain.',
                        error=str(error), history=[])
        if not answer['converged']:
            answer['message'] = 'No solution found within the calculation limits.'
        return answer

    n = attempt(lambda: newton(f, df, ddf, point, start=start))
    g = attempt(lambda: golden_section(f, point, *interval))
    code = ('import math\nfrom solution import newton, golden_section, NumericalError\n\n'
            + inspect.getsource(factory)
            + f'\nf, df, ddf = {factory.__name__}()\n'
            + f'point = {point}\n'
            + 'try:\n'
            + f'    n = newton(f, df, ddf, point, start={start})\n'
            + f'    g = golden_section(f, point, a={interval[0]}, b={interval[1]})\n'
            + "    for answer in (n, g):\n"
            + "        if not answer['converged']:\n"
            + "            raise RuntimeError('No solution found within the calculation limits.')\n"
            + "        print(answer['x'], answer['y'], answer['distance'])\n"
            + "except (ValueError, RuntimeError) as error:\n"
            + "    print(f'Calculation failed: {error}')\n")
    return dict(label=label, formula=formula, domain=domain, point=point,
                starts=[start], intervals=[interval], newton=[n], golden=[g], code=code,
                curve=samples(f, *interval) if n['converged'] and g['converged'] else [],
                objective=samples(lambda x: objective(f, point, x), *interval)
                if n['converged'] and g['converged'] else [])


def generate():
    f, df, ddf = parabola()
    cases = []
    for x0 in (0, -4, -8, 2, 6):
        point = (x0, 0)
        nr = newton(f, df, ddf, point)
        cases.append(dict(point=point, analytical=analytical(x0), newton=nr,
                          golden=golden_section(f, point, -2, 2),
                          objective=samples(lambda x: objective(f, point, x), -1.1, 1.1)))
    examples = [
        example('Exponential', 'e^x', 'All real x', exponential_functions, 0, (-2, 1)),
        example('Logarithmic', r'\ln x', 'x > 0', logarithmic_functions, 1, (0.1, 2)),
    ]
    return dict(settings=dict(newton_residual_tol=1e-12, newton_step_tol=1e-14,
                              golden_width_tol=1e-7, golden_interval=[-2, 2]),
                curve=samples(f, -3, 3), cases=cases, examples=examples)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Write standalone result JSON to this path.')
    args = parser.parse_args()
    data = generate()
    encoded = json.dumps(data, indent=2, allow_nan=False) + '\n'
    source = Path(__file__).resolve()
    root = source.parent.parent
    if args.output:
        destinations = [args.output]
    elif source.parent.name == 'scripts' and (root / 'src').is_dir():
        destinations = [root / 'src/assignment1/results.json', root / 'public/assignment1/results.json']
        download = root / 'public/assignment1/solution.py'
        download.parent.mkdir(parents=True, exist_ok=True)
        download.write_text(source.read_text())
    else:
        destinations = [Path('results.json')]
    for path in destinations:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(encoded)
        print(f'Wrote {path}')
    for case in data['cases']:
        print(f"P={case['point']}: d={case['analytical']['distance']:.9f}; "
              f"Newton: {case['newton']['status']} Golden: {case['golden']['status']}")


if __name__ == '__main__':
    main()
