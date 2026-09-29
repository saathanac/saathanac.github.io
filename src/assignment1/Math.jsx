import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathText({ children, block = false }) {
  const Tag = block ? 'div' : 'span';
  return <Tag className={block ? 'equation' : 'inline-math'} dangerouslySetInnerHTML={{
    __html: katex.renderToString(children, {
      displayMode: block, throwOnError: true, trust: false, output: 'htmlAndMathml',
    }),
  }} />;
}
