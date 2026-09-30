"""SYDE 572 Assignment 1, Part 2. Python 3.10+, standard library only.

Run in the repo: python3 scripts/assignment1_part2.py
Standalone:     python3 fitting.py --output fitting-results.json
"""
import argparse
import json
import math
from pathlib import Path

POINTS = [(0, .5), (2, 3.5), (1, 1.5), (3, 7.5)]


def finite(value):
    value = float(value)
    if not math.isfinite(value):
        raise ValueError('Values must be finite.')
    return value


def design_matrix(points, degree):
    if degree not in (1, 2):
        raise ValueError('Use degree 1 (line) or 2 (parabola).')
    if not points:
        raise ValueError('Supply at least one point.')
    rows, targets = [], []
    for x, y in points:
        x, y = finite(x), finite(y)
        rows.append([x**power for power in range(degree, -1, -1)])
        targets.append(y)
    return rows, targets


def predictions(parameters, xs):
    """Polynomial coefficients are ordered from highest power to constant."""
    outputs = []
    for x in xs:
        value = 0.0
        for coefficient in parameters:
            value = value * finite(x) + finite(coefficient)
        outputs.append(finite(value))
    return outputs


def mse(parameters, points):
    if not points:
        raise ValueError('Supply at least one point.')
    predicted = predictions(parameters, [p[0] for p in points])
    return finite(sum((yhat-finite(p[1]))**2 for yhat, p in zip(predicted, points))/len(points))


def system(points, degree):
    rows, targets = design_matrix(points, degree)
    size = degree + 1
    gram = [[sum(row[i]*row[j] for row in rows) for j in range(size)] for i in range(size)]
    rhs = [sum(row[i]*y for row, y in zip(rows, targets)) for i in range(size)]
    hessian = [[2*value/len(rows) for value in row] for row in gram]
    return gram, rhs, hessian


def gradient(parameters, gram, rhs, count):
    return [2/count*(sum(a*b for a, b in zip(row, parameters))-target)
            for row, target in zip(gram, rhs)]


def solve_linear(matrix, vector):
    """Gaussian elimination with partial pivoting; never forms an inverse."""
    size = len(vector)
    if len(matrix) != size or any(len(row) != size for row in matrix):
        raise ValueError('The linear system must be square.')
    aug = [[finite(v) for v in row]+[finite(value)] for row, value in zip(matrix, vector)]
    scale = max((abs(v) for row in matrix for v in row), default=0)
    for col in range(size):
        pivot = max(range(col, size), key=lambda i: abs(aug[i][col]))
        if abs(aug[pivot][col]) <= 1e-14*max(1, scale):
            raise ValueError('The data do not uniquely determine this model.')
        aug[col], aug[pivot] = aug[pivot], aug[col]
        for row in range(col+1, size):
            ratio = aug[row][col]/aug[col][col]
            for j in range(col, size+1):
                aug[row][j] -= ratio*aug[col][j]
    answer = [0.0]*size
    for i in range(size-1, -1, -1):
        answer[i] = (aug[i][-1]-sum(aug[i][j]*answer[j] for j in range(i+1, size)))/aug[i][i]
    return answer


def initial_parameters(start, degree):
    parameters = [0.0]*(degree+1) if start is None else [finite(x) for x in start]
    if len(parameters) != degree+1:
        raise ValueError('Wrong number of model parameters.')
    return parameters


def snapshot(parameters, points, gram, rhs, iteration, **extra):
    grad = gradient(parameters, gram, rhs, len(points))
    return dict(iteration=iteration, parameters=parameters.copy(), mse=mse(parameters, points),
                gradient=grad, gradient_norm=max(map(abs, grad)), **extra)


def simultaneous_newton(points, degree, start=None, tolerance=1e-8):
    """Update all coefficients together by solving H delta = gradient.

    These full-rank quadratic objectives require one step in exact arithmetic.
    Record the initial and final states and verify the final gradient tolerance.
    """
    tolerance = finite(tolerance)
    if tolerance <= 0:
        raise ValueError('Use a positive tolerance.')
    gram, rhs, hessian = system(points, degree)
    before = initial_parameters(start, degree)
    initial = snapshot(before, points, gram, rhs, 0)
    grad = initial['gradient']
    delta = solve_linear(hessian, grad)
    parameters = [finite(value-step) for value, step in zip(before, delta)]
    final = snapshot(parameters, points, gram, rhs, 1)
    converged = final['gradient_norm'] < tolerance
    return dict(**final, before=before, starting_gradient=grad, hessian=hessian,
                delta=delta, history=[initial, final], tolerance=tolerance,
                converged=converged,
                status='Converged.' if converged else 'Newton update did not meet the gradient tolerance.')


def generate():
    models = []
    for label, degree, names, exact in [('Line', 1, ['m', 'b'], [2.3, -.2]),
                                       ('Parabola', 2, ['a', 'b', 'c'], [.75, .05, .55])]:
        gram, rhs, hessian = system(POINTS, degree)
        numerical = simultaneous_newton(POINTS, degree)
        observed = []
        for (x, y), fitted in zip(POINTS, predictions(exact, [p[0] for p in POINTS])):
            observed.append(dict(x=x, y=y, fitted=fitted, residual=fitted-y, squared_residual=(fitted-y)**2))
        xs = [-.2+3.4*i/160 for i in range(161)]
        fits = [dict(iteration=row['iteration'], parameters=row['parameters'],
                     points=list(zip(xs, predictions(row['parameters'], xs)))) for row in numerical['history']]
        models.append(dict(label=label, degree=degree, names=names, gram=gram, rhs=rhs,
                           hessian=hessian, analytical=dict(parameters=exact, mse=mse(exact, POINTS), rows=observed),
                           simultaneous=numerical, fits=fits))
    return dict(points=POINTS, models=models)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve()
    root = source.parent.parent
    data = generate()
    if args.output:
        destinations = [args.output]
    elif source.parent.name == 'scripts' and (root/'src').is_dir():
        destinations = [root/'src/assignment1/fitting-results.json', root/'public/assignment1/fitting-results.json']
        (root/'public/assignment1/fitting.py').write_text(source.read_text())
    else:
        destinations = [Path('fitting-results.json')]
    for path in destinations:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, allow_nan=False)+'\n')
        print(f'Wrote {path}')
    for model in data['models']:
        r = model['simultaneous']
        print(f"{model['label']}: {r['parameters']}, MSE={r['mse']:.10f}, {r['iteration']} Newton iteration. {r['status']}")


if __name__ == '__main__':
    main()
