import importlib.util
import json
import math
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('fitting', ROOT/'scripts/assignment1_part2.py')
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)


class FittingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = f.generate()

    def test_analytical_and_numerical_agree(self):
        for model, expected, error in zip(self.data['models'], [[2.3, -.2], [.75, .05, .55]], [.575, .0125]):
            r = model['simultaneous']
            self.assertTrue(r['converged'])
            self.assertLess(r['gradient_norm'], 1e-8)
            for value, exact in zip(r['parameters'], expected):
                self.assertAlmostEqual(value, exact, delta=3e-8)
            self.assertAlmostEqual(r['mse'], error, places=13)
            self.assertAlmostEqual(model['analytical']['mse'], error, places=13)
            for row in model['analytical']['rows']:
                self.assertAlmostEqual(row['residual'], row['fitted']-row['y'], places=14)
                self.assertAlmostEqual(row['squared_residual'], row['residual']**2, places=14)

    def test_normal_equations_and_positive_definite_hessians(self):
        line, parabola = self.data['models']
        self.assertEqual(line['gram'], [[14, 6], [6, 4]])
        self.assertEqual(line['rhs'], [31, 13])
        self.assertEqual(parabola['gram'], [[98, 36, 14], [36, 14, 6], [14, 6, 4]])
        self.assertEqual(parabola['rhs'], [83, 31, 13])
        for m in [line, parabola]:
            h = m['hessian']
            self.assertGreater(h[0][0], 0)
            self.assertGreater(h[0][0]*h[1][1]-h[0][1]*h[1][0], 0)
            if m['degree'] == 2:
                det = (h[0][0]*(h[1][1]*h[2][2]-h[1][2]*h[2][1])
                       - h[0][1]*(h[1][0]*h[2][2]-h[1][2]*h[2][0])
                       + h[0][2]*(h[1][0]*h[2][1]-h[1][1]*h[2][0]))
                self.assertGreater(det, 0)

    def test_simultaneous_history_and_plot_data(self):
        for m in self.data['models']:
            r = m['simultaneous']
            self.assertEqual([row['iteration'] for row in r['history']], [0, 1])
            self.assertEqual(r['history'][0]['parameters'], [0]*(m['degree']+1))
            self.assertEqual(r['history'][-1]['parameters'], r['parameters'])
            self.assertLessEqual(r['mse'], r['history'][0]['mse'])
            for i, row in enumerate(m['hessian']):
                self.assertAlmostEqual(sum(v*d for v, d in zip(row, r['delta'])), r['starting_gradient'][i], places=12)
            for curve in m['fits']:
                self.assertEqual(curve['parameters'], r['history'][curve['iteration']]['parameters'])
                for x, y in curve['points']:
                    self.assertAlmostEqual(y, f.predictions(curve['parameters'], [x])[0], places=14)

    def test_simultaneous_is_one_step_even_from_other_starts(self):
        for m in self.data['models']:
            for start in [None, [10]*(m['degree']+1)]:
                r = f.simultaneous_newton(f.POINTS, m['degree'], start)
                for value, expected in zip(r['parameters'], m['analytical']['parameters']):
                    self.assertAlmostEqual(value, expected, delta=1e-12)
                self.assertLess(r['gradient_norm'], 1e-12)
                self.assertEqual(r['iteration'], 1)

    def test_invalid_inputs_and_failure_status(self):
        r = f.simultaneous_newton(f.POINTS, 1, tolerance=1e-30)
        self.assertFalse(r['converged'])
        self.assertIn('did not meet', r['status'])
        for points in [[], [(1, 1), (1, 2)], [(math.nan, 0)]]:
            with self.assertRaises(ValueError):
                f.simultaneous_newton(points, 1)
        for tolerance in [0, -1, math.nan]:
            with self.assertRaises(ValueError):
                f.simultaneous_newton(f.POINTS, 1, tolerance=tolerance)
        with self.assertRaises(ValueError):
            f.simultaneous_newton(f.POINTS, 2, start=[0, 0])

    def test_coordinate_updates_and_convergence(self):
        for m, sweeps in zip(self.data['models'], [40, 422]):
            r = m['sequential']
            self.assertTrue(r['converged'])
            self.assertEqual(r['iteration'], sweeps)
            previous = [0]*(m['degree']+1)
            last_error = f.mse(previous, f.POINTS)
            for row in r['updates']:
                self.assertEqual(row['before'], previous)
                j = row['coordinate']
                expected = (m['rhs'][j]-sum(v*previous[k] for k, v in enumerate(m['gram'][j]) if k != j))/m['gram'][j][j]
                self.assertAlmostEqual(row['parameters'][j], expected, places=14)
                self.assertLessEqual(row['mse'], last_error+1e-13)
                previous, last_error = row['parameters'], row['mse']
            for value, exact in zip(r['parameters'], m['analytical']['parameters']):
                self.assertAlmostEqual(value, exact, delta=3e-8)
            self.assertAlmostEqual(r['mse'], m['analytical']['mse'], places=13)
            self.assertFalse(f.coordinate_newton(f.POINTS, m['degree'], max_sweeps=1)['converged'])
            for curve in m['sequential_fits']:
                self.assertEqual(curve['parameters'], r['history'][curve['iteration']]['parameters'])
                for x, y in curve['points']:
                    self.assertAlmostEqual(y, f.predictions(curve['parameters'], [x])[0], places=14)

    def test_saved_results_and_download(self):
        for path in ['src/assignment1/fitting-results.json', 'public/assignment1/fitting-results.json']:
            self.assertEqual(json.loads((ROOT/path).read_text()), json.loads(json.dumps(self.data)))
        self.assertEqual((ROOT/'scripts/assignment1_part2.py').read_text(), (ROOT/'public/assignment1/fitting.py').read_text())


if __name__ == '__main__':
    unittest.main()
