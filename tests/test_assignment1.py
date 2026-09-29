"""Numerical, failure-mode, and reproducibility checks (standard library only)."""
import importlib.util
import json
import math
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('assignment1', ROOT / 'scripts/assignment1.py')
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)


class AssignmentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = s.generate()
        cls.f, cls.df, cls.ddf = (staticmethod(f) for f in s.parabola())

    def test_assigned_reference_values_and_agreement(self):
        for c, expected in zip(self.data['cases'], [5, 6.289845, 9.133420, 5.351396, 7.603125]):
            with self.subTest(point=c['point']):
                a, n, g = c['analytical'], c['newton'], c['golden']
                self.assertAlmostEqual(a['distance'], expected, delta=5e-7)
                self.assertTrue(n['converged'])
                self.assertTrue(g['converged'])
                self.assertLess(abs(n['x']-a['x']), 1e-10)
                self.assertLess(abs(g['x']-a['x']), 1e-7)
                self.assertLess(abs(n['distance']-a['distance']), 1e-10)
                self.assertLess(abs(g['distance']-a['distance']), 1e-10)
                self.assertLessEqual(n['residual'], 1e-12)
                for r in [a, n, g]:
                    self.assertAlmostEqual(r['y'], r['x']**2+5, places=13)
                    self.assertAlmostEqual(r['distance'], math.hypot(r['x']-c['point'][0], r['y']), places=12)
                # Independent bisection of the monotone cubic validates Cardano.
                lo, hi = -2, 2
                for _ in range(70):
                    mid = (lo+hi)/2
                    if 2*mid**3+11*mid-c['point'][0] > 0:
                        hi = mid
                    else:
                        lo = mid
                self.assertAlmostEqual(a['x'], (lo+hi)/2, places=13)
                self.assertAlmostEqual((a['x']-c['point'][0])+2*a['x']*a['y'], 0, places=11)

    def test_newton_history_uses_final_accepted_iterate(self):
        for c in self.data['cases']:
            n = c['newton']
            self.assertEqual(n['x'], n['history'][-1]['next'])
            self.assertEqual(n['squared_distance'], n['history'][-1]['next_D'])
            self.assertEqual(n['history'][0]['x'], 0)
            for row in n['history']:
                self.assertAlmostEqual(row['next'], row['x']-row['first']/row['second'], places=14)
        self.assertEqual(len(self.data['cases'][0]['newton']['history']), 1)
        self.assertIn('Already stationary', self.data['cases'][0]['newton']['history'][0]['action'])

    def test_golden_history_contracts_and_midpoint_is_used(self):
        for c in self.data['cases']:
            g = c['golden']
            a, b = -2, 2
            for row in g['history']:
                self.assertEqual((row['a'], row['b']), (a, b))
                self.assertLess(row['a'], row['u'])
                self.assertLess(row['u'], row['v'])
                self.assertLess(row['v'], row['b'])
                a, b = row['retained_a'], row['retained_b']
                self.assertLess(b-a, row['width'])
                self.assertGreaterEqual(a, row['a'])
                self.assertLessEqual(b, row['b'])
                self.assertLessEqual(a-1e-7, c['analytical']['x'])
                self.assertGreaterEqual(b+1e-7, c['analytical']['x'])
            self.assertEqual((a, b), (g['a'], g['b']))
            self.assertEqual(g['x'], a+(b-a)/2)
            self.assertLessEqual(g['width'], 1e-7)
        self.assertEqual(self.data['cases'][0]['golden']['history'][0]['comparison'], '=')

    def test_non_polynomial_agreement_and_unique_minima(self):
        # On R, exponential D'' = 2 + 4 exp(2x) > 0.
        # On x > 0, logarithmic D'' >= 2 - exp(-3) > 0:
        # (log(x)-1)/x² reaches its maximum at exp(3/2).
        # Both objectives diverge at the ends of their domains, so the
        # unique stationary root bracketed below is the global minimum.
        self.assertEqual([e['label'] for e in self.data['examples']], ['Exponential', 'Logarithmic'])
        for e, factory, interval in zip(self.data['examples'],
                                       [s.exponential_functions, s.logarithmic_functions],
                                       [(-2, 1), (.1, 2)]):
            f, df, ddf = factory()
            n, g = e['newton'][0], e['golden'][0]
            self.assertEqual(tuple(e['intervals'][0]), interval)
            self.assertTrue(n['converged'])
            self.assertTrue(g['converged'])
            self.assertLessEqual(n['residual'], 1e-12)
            self.assertLessEqual(g['width'], 1e-7)
            self.assertLess(abs(n['x']-g['x']), 1e-7)
            self.assertLess(abs(n['distance']-g['distance']), 1e-10)
            for r in [n, g]:
                self.assertAlmostEqual(r['y'], f(r['x']), places=14)
                self.assertGreater(r['x'], interval[0])
                self.assertLess(r['x'], interval[1])
            lo, hi = interval
            self.assertLess(s.derivatives(f, df, ddf, (0, 0), lo)[0], 0)
            self.assertGreater(s.derivatives(f, df, ddf, (0, 0), hi)[0], 0)
            for _ in range(80):
                mid = (lo+hi)/2
                if s.derivatives(f, df, ddf, (0, 0), mid)[0] < 0:
                    lo = mid
                else:
                    hi = mid
            self.assertAlmostEqual(n['x'], (lo+hi)/2, delta=1e-12)
            for row in g['history']:
                self.assertLess(row['retained_b']-row['retained_a'], row['width'])
            # Every saved sample respects the example's domain.
            for x, y in e['curve']:
                self.assertAlmostEqual(y, f(x), places=14)
            # Execute the actual displayed code with the shared solver module.
            import contextlib, io, sys
            from unittest.mock import patch
            with patch.dict(sys.modules, {'solution': s}), contextlib.redirect_stdout(io.StringIO()) as output:
                namespace = {}
                exec(e['code'], namespace)
            self.assertNotIn('failed', output.getvalue())
            self.assertEqual(namespace['n'], n)
            self.assertEqual(namespace['g'], g)

    def test_logarithmic_domain_is_enforced(self):
        for function in s.logarithmic_functions():
            for x in [0, -1]:
                with self.assertRaisesRegex(s.NumericalError, 'x > 0'):
                    function(x)
        f, df, ddf = s.logarithmic_functions()
        with self.assertRaisesRegex(s.NumericalError, 'x > 0'):
            s.newton(f, df, ddf, (0, 0), start=-1)
        with self.assertRaisesRegex(s.NumericalError, 'x > 0'):
            s.golden_section(f, (0, 0), -1, 2)

    def test_example_failure_messages(self):
        invalid = s.example('Logarithmic', 'log(x)', 'x > 0', s.logarithmic_functions, 0, (-1, 2))
        self.assertFalse(invalid['newton'][0]['converged'])
        self.assertFalse(invalid['golden'][0]['converged'])
        self.assertEqual(invalid['curve'], [])
        from unittest.mock import patch
        with patch.object(s, 'newton', side_effect=s.NumericalError('Invalid domain')):
            e = s.example('Exponential', 'e^x', 'All real x', s.exponential_functions, 0, (-2, 1))
            self.assertFalse(e['newton'][0]['converged'])
            self.assertIn('Check its domain', e['newton'][0]['status'])
        failed = dict(converged=False, status='Maximum iterations reached.', history=[])
        with patch.object(s, 'golden_section', return_value=failed):
            e = s.example('Exponential', 'e^x', 'All real x', s.exponential_functions, 0, (-2, 1))
            self.assertEqual(e['golden'][0]['message'], 'No solution found within the calculation limits.')

    def test_two_global_minima_remains_supported_by_routines(self):
        f, df, ddf = s.parabola(1, 0, 0)
        for start in [-2, 2]:
            r = s.newton(f, df, ddf, (0, 2), start=start)
            self.assertAlmostEqual(abs(r['x']), math.sqrt(1.5), delta=1e-7)
            self.assertAlmostEqual(r['distance'], math.sqrt(7)/2, places=12)
        self.assertEqual(s.newton(f, df, ddf, (0, 2), start=0)['classification'], 'local maximum')

    def test_general_parabola_and_nonzero_point_height(self):
        f, df, ddf = s.parabola(2, -3, 4)
        r = s.newton(f, df, ddf, (1, f(1)), start=1)
        self.assertEqual(r['distance'], 0)
        self.assertEqual(df(2), 5)
        self.assertEqual(ddf(2), 4)
        f, df, ddf = s.parabola()
        r = s.newton(f, df, ddf, (0, 10), start=3)
        self.assertAlmostEqual(r['x'], math.sqrt(4.5), places=12)

    def test_domain_and_nonfinite_errors(self):
        with self.assertRaisesRegex(s.NumericalError, 'Cannot evaluate f'):
            s.golden_section(math.log, (0, 0), -1, 2)
        with self.assertRaisesRegex(s.NumericalError, 'Cannot evaluate f'):
            s.newton(math.log, lambda x: 1/x, lambda x: -1/x**2, (0, 0), start=0)
        for value in [math.nan, math.inf, complex(1, 2)]:
            with self.subTest(value=value), self.assertRaises(s.NumericalError):
                s.golden_section(lambda x: value, (0, 0), -1, 1)
        with self.assertRaisesRegex(s.NumericalError, 'finite'):
            s.newton(self.f, self.df, self.ddf, (math.inf, 0))
        with self.assertRaisesRegex(s.NumericalError, 'evaluate'):
            s.golden_section(math.exp, (0, 0), 1000, 1001)

    def test_input_validation(self):
        for a, b in [(1, 1), (2, 1)]:
            with self.assertRaisesRegex(ValueError, 'a < b'):
                s.golden_section(self.f, (0, 0), a, b)
        for tol in [0, -1, math.inf]:
            with self.assertRaises(ValueError):
                s.golden_section(self.f, (0, 0), -2, 2, width_tol=tol)
        for maximum in [0, -1, 1.2, True]:
            with self.assertRaisesRegex(ValueError, 'max_iter'):
                s.newton(self.f, self.df, self.ddf, (0, 0), max_iter=maximum)
        with self.assertRaisesRegex(ValueError, 'exactly'):
            s.golden_section(self.f, (0,), -2, 2)

    def test_failures_are_not_reported_as_convergence(self):
        f, df, ddf = s.parabola(1, 0, 0)
        bad = s.newton(f, df, ddf, (1, .5), start=0)
        self.assertFalse(bad['converged'])
        self.assertIn('Near-zero', bad['status'])
        n = s.newton(self.f, self.df, self.ddf, (-8, 0), max_iter=1)
        self.assertFalse(n['converged'])
        self.assertIn('Maximum', n['status'])
        self.assertEqual(n['x'], n['history'][-1]['next'])
        g = s.golden_section(self.f, (-8, 0), -2, 2, max_iter=1)
        self.assertFalse(g['converged'])
        self.assertIn('Maximum', g['status'])
        n = s.newton(self.f, self.df, self.ddf, (-8, 0), step_tol=1)
        self.assertFalse(n['converged'])
        self.assertIn('stagnated', n['status'])

    def test_saved_data_and_download_match_source(self):
        for path in ['src/assignment1/results.json', 'public/assignment1/results.json']:
            self.assertEqual(json.loads((ROOT/path).read_text()), json.loads(json.dumps(self.data)))
        self.assertEqual((ROOT/'scripts/assignment1.py').read_text(), (ROOT/'public/assignment1/solution.py').read_text())


if __name__ == '__main__':
    unittest.main()
