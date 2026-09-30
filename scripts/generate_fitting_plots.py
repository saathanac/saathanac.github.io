"""Generate Part 2 SVGs from fitting-results.json (requires existing Matplotlib)."""
import json
import os
from pathlib import Path

os.environ.setdefault('MPLCONFIGDIR', '/tmp/syde572-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT/'src/assignment1/fitting-results.json').read_text())
OUT = ROOT/'public/assignment1/plots'
OUT.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.labelcolor': '#29382f', 'text.color': '#29382f', 'axes.edgecolor': '#b1b9ae',
                     'grid.color': '#e1e6dd', 'svg.fonttype': 'none', 'svg.hashsalt': 'syde572-part2'})

for model in DATA['models']:
    name = model['label'].lower()
    final = model['simultaneous']
    fig, ax = plt.subplots(figsize=(9, 4), layout='constrained')
    colors = ['#999999', '#315d43']
    styles = [':', '-']
    ax.scatter(*zip(*DATA['points']), color='#202a24', marker='o', s=32, zorder=5, label='Observed data')
    for curve, color, style in zip(model['fits'], colors, styles):
        k = curve['iteration']
        label = f'Iteration {k}'
        if k == 0:
            label += ' (start: ŷ = 0)'
        elif k == final['iteration']:
            label += ' (final)'
        ax.plot(*zip(*curve['points']), color=color, ls=style, lw=1.7, label=label)
    for x, y in DATA['points']:
        ax.annotate(f'({x}, {y})', (x, y), xytext=(5, 7), textcoords='offset points', fontsize=8)
    equation = 'ŷ = 2.3x − 0.2' if name == 'line' else 'ŷ = 0.75x² + 0.05x + 0.55'
    ax.set_title(f'{model["label"]}: final fit {equation}', fontsize=11)
    ax.set_xlabel('x')
    ax.set_ylabel('y / predicted y')
    ax.grid(alpha=.7)
    ax.set_axisbelow(True)
    ax.margins(y=.15)
    ax.legend(loc='upper left', fontsize=8)
    fig.savefig(OUT/f'part2-{name}-fits.svg', metadata={'Date': None}, facecolor='white')
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(9, 4), layout='constrained')
    ax.semilogy([r['iteration'] for r in final['history']], [r['mse'] for r in final['history']],
                color='#315d43', marker='o')
    for row in final['history']:
        offset = (12, -12) if row['iteration'] == 0 else (-190, 22)
        ax.annotate(f"Iteration {row['iteration']}: MSE = {row['mse']:.4f}",
                    (row['iteration'], row['mse']), xytext=offset, textcoords='offset points', fontsize=9)
    ax.set_xticks([0, 1])
    ax.axhline(model['analytical']['mse'], color='#285d8c', ls='--', lw=1, label='Analytical minimum')
    ax.set_title(f'{model["label"]}: MSE before and after Newton’s update', fontsize=11)
    ax.set_xlabel('Newton iteration')
    ax.set_ylabel('Mean squared error (log scale)')
    ax.grid(alpha=.7)
    ax.set_axisbelow(True)
    ax.legend(fontsize=9)
    fig.savefig(OUT/f'part2-{name}-mse.svg', metadata={'Date': None}, facecolor='white')
    plt.close(fig)
print(f'Wrote 4 Part 2 SVG figures to {OUT}')
