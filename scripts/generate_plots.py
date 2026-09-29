"""Generate reproducible, downloadable SVG figures from Python result data."""
import argparse
import json
import os
from pathlib import Path

os.environ.setdefault('MPLCONFIGDIR', '/tmp/syde572-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'src/assignment1/results.json').read_text())
OUT = ROOT / 'public/assignment1/plots'
OUT.mkdir(parents=True, exist_ok=True)
GREEN, BLUE, AMBER = '#315d43', '#285d8c', '#97611d'
plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.labelcolor': '#29382f', 'text.color': '#29382f',
                     'axes.edgecolor': '#b1b9ae', 'grid.color': '#e1e6dd',
                     'svg.fonttype': 'none', 'svg.hashsalt': 'syde572-part1'})


def style(ax, xlabel, ylabel):
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.grid(alpha=.7)
    ax.set_axisbelow(True)


def save(fig, name):
    fig.savefig(OUT / name, format='svg', metadata={'Date': None}, facecolor='white')
    plt.close(fig)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--examples-only', action='store_true', help='Only refresh non-polynomial figures.')
args = parser.parse_args()
plot_cases = [] if args.examples_only else [(str(i), c, None) for i, c in enumerate(DATA['cases'])]
for i, e in enumerate(DATA['examples']):
    if e['newton'][0]['converged'] and e['golden'][0]['converged']:
        plot_cases.append((f'example-{i}', dict(point=e['point'], analytical=e['newton'][0],
                          newton=e['newton'][0], golden=e['golden'][0], objective=e['objective']), e))

for index, c, example in plot_cases:
    p, a, n, g = c['point'], c['analytical'], c['newton'], c['golden']
    fig, ax = plt.subplots(figsize=(6, 5), layout='constrained')
    ax.plot(*zip(*(example['curve'] if example else DATA['curve'])), color=GREEN,
            label=f"y = ${example['formula']}$" if example else 'y = x² + 5')
    ax.plot([p[0], a['x']], [p[1], a['y']], '--', color=AMBER, label=f"d = {a['distance']:.6f}")
    ax.scatter(*p, c=BLUE, marker='s', zorder=4)
    ax.scatter(a['x'], a['y'], c=GREEN, zorder=4)
    ax.annotate(f'P = ({p[0]}, {p[1]})', p, xytext=(4, 10), textcoords='offset points', fontsize=9)
    ax.annotate(f"Q* = ({a['x']:.6f}, {a['y']:.6f})", (a['x'], a['y']),
                xytext=(12, 17), textcoords='offset points', fontsize=9,
                arrowprops={'arrowstyle': '-', 'color': GREEN})
    if example:
        xs, ys = zip(*example['curve'])
        ax.set_xlim(min(0, min(xs)) - .35, max(xs) + .35)
        ax.set_ylim(min(0, min(ys)) - .35, max(ys) + .5)
    else:
        tangent_x = [a['x'] - 1.3, a['x'] + 1.3]
        ax.plot(tangent_x, [a['y'] + 2*a['x']*(x-a['x']) for x in tangent_x],
                ':', color='#777777', label='Tangent at Q*')
        ax.set_xlim(min(-3.5, p[0]-1), max(4, p[0]+1))
        ax.set_ylim(-1.5, 15)
    ax.set_aspect('equal', adjustable='box')
    style(ax, 'x (coordinate units)', 'y (coordinate units)')
    ax.legend(loc='upper left', fontsize=8, framealpha=.95)
    save(fig, f'{index}-geometry.svg')

    fig, (ax, trace) = plt.subplots(1, 2, figsize=(9, 4), layout='constrained')
    ax.plot(*zip(*c['objective']), color=GREEN)
    estimates = [n['history'][0]['x']] + [r['next'] for r in n['history'] if r['action'] == 'Accepted update.']
    distances = [n['history'][0]['D']] + [r['next_D'] for r in n['history'] if r['action'] == 'Accepted update.']
    ax.scatter(estimates, distances, c=AMBER, zorder=4, s=25)
    ax.annotate('k = 0', (estimates[0], distances[0]), xytext=(10, 28), textcoords='offset points',
                fontsize=9, arrowprops={'arrowstyle': '-', 'color': AMBER})
    if len(estimates) > 1:
        ax.annotate(f'k = 1…{len(estimates)-1}', (estimates[-1], distances[-1]),
                    xytext=(-65, 50), textcoords='offset points', fontsize=9,
                    arrowprops={'arrowstyle': '-', 'color': AMBER})
    ax.set_title(f'D(x) for P = ({p[0]}, {p[1]})', fontsize=11)
    style(ax, 'x (coordinate units)', 'D(x) (squared units)')
    trace.plot(range(len(estimates)), estimates, 'o-', color=BLUE, markersize=4)
    trace.axhline(a['x'], ls='--', color=GREEN, label=f"x* ≈ {a['x']:.6f}")
    for k, x in enumerate(estimates):
        trace.annotate(str(k), (k, x), xytext=(0, 8 if k % 2 == 0 else -15),
                       textcoords='offset points', ha='center', fontsize=8)
    trace.set_xticks(range(len(estimates)))
    trace.margins(x=.15, y=.3)
    trace.set_title('Newton’s estimate at each iteration', fontsize=11)
    style(trace, 'Iteration k', 'x⁽ᵏ⁾ (coordinate units)')
    trace.legend(loc='best', fontsize=8)
    save(fig, f'{index}-newton.svg')

    fig, (ax, width_ax) = plt.subplots(1, 2, figsize=(9, 4), layout='constrained')
    intervals = [tuple(example['intervals'][0]) if example else (-2, 2)] + [(r['retained_a'], r['retained_b']) for r in g['history']]
    chosen = sorted(set([0, 1, 2, 3, 5, 10, len(intervals)-1]))
    for row, k in enumerate(chosen):
        lo, hi = intervals[k]
        ax.plot([lo, hi], [row, row], color=GREEN, lw=3, marker='|', markersize=8)
    ax.axvline(a['x'], color=AMBER, ls='--', label='Final Newton estimate' if example else 'Analytical x*')
    ax.set_yticks(range(len(chosen)), [f'k = {k}' for k in chosen])
    ax.invert_yaxis()
    lo, hi = intervals[0]
    ax.set_xlim(lo - .05*(hi-lo), hi + .05*(hi-lo))
    ax.set_title('Intervals after k updates', fontsize=11)
    style(ax, 'x (coordinate units)', 'Update number')
    ax.legend(fontsize=8, loc='best')
    width_ax.semilogy(range(len(intervals)), [b-a for a,b in intervals], 'o-',
                      color=BLUE, markersize=2.5, label='Interval width')
    width_ax.axhline(1e-7, color=AMBER, ls='--', label='Tolerance 10⁻⁷')
    width_ax.set_title('Every interval contraction', fontsize=11)
    style(width_ax, 'Updates completed', 'b − a (coordinate units, log scale)')
    width_ax.legend(fontsize=8)
    save(fig, f'{index}-golden.svg')
print(f'Wrote {3 * len(plot_cases)} SVG figures to {OUT}')
