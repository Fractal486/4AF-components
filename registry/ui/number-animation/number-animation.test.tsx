import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { NumberAnimation } from './number-animation';

it('rolls changed digits with the SF Interface timing and blur profile', async () => {
  const original = Element.prototype.animate;
  const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn(), playState: 'finished' }) as unknown as Animation);
  Element.prototype.animate = animate;
  try {
    const {rerender}=render(<NumberAnimation value={4} />);
    expect(animate).not.toHaveBeenCalled();
    await act(async () => rerender(<NumberAnimation value={8} />));
    const calls=animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
    const roll=calls.find(([frames]) => frames.some(frame => frame.translate));
    expect(roll?.[1]).toMatchObject({ duration: 520, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    const blur=calls.find(([frames]) => frames.some(frame => frame.filter && frame.offset === 0.15));
    expect(blur?.[0].map(frame=>frame.offset)).toEqual([0,0.15,0.62,1]);
    expect(blur?.[0][2]?.filter).toBe('blur(0px)');
  } finally { Element.prototype.animate = original; }
});

it('skips rolling and blur for reduced motion', () => {
  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: true, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  const original = Element.prototype.animate;
  const animate = vi.fn();Element.prototype.animate = animate;
  try {
    const {rerender}=render(<NumberAnimation value={4} />);
    rerender(<NumberAnimation value={8} />);
    expect(animate).not.toHaveBeenCalled();
  } finally { Element.prototype.animate = original; matchMedia.mockRestore(); }
});

it('forwards the ref and native props through a replacement element', () => {
  const ref = createRef<HTMLSpanElement>();
  const { container, rerender } = render(<NumberAnimation ref={ref} render={<output />} value={12} aria-label="Total" />);
  expect(ref.current).toBe(container.querySelector('output'));
  expect(ref.current).toHaveAttribute('aria-label', 'Total');
  rerender(<NumberAnimation ref={ref} render={<output />} value={23} aria-label="Total" />);
  expect(ref.current?.querySelector('[data-slot="number-animation-text"]')).toHaveTextContent('23');
});

it.each([
  ['de-DE', -1234.56, { style: 'currency', currency: 'EUR' }],
  ['ar-EG', 12.5, { minimumFractionDigits: 1 }],
  ['en-US', 0.375, { style: 'percent', maximumFractionDigits: 1 }],
] as const)('preserves %s formatting and a single accessible value', (locales, value, format) => {
  const { container } = render(<NumberAnimation value={value} locales={locales} format={format} prefix="Total: " suffix=" today" />);
  const accessible = container.querySelector('[data-slot="number-animation-text"]');
  expect(accessible?.textContent).toBe(`Total: ${new Intl.NumberFormat(locales, format).format(value)} today`);
  const columns = container.querySelectorAll('[data-slot="number-animation-digit"], [data-slot="number-animation-symbol"]');
  for (const column of columns) expect(column).toHaveAttribute('aria-hidden', 'true');
});

it('uses localized glyphs even when their code points are not consecutive', () => {
  const { container } = render(<NumberAnimation value={7} locales="zh-Hans-CN-u-nu-hanidec" />);
  const column = container.querySelector('[data-slot="number-animation-column"]')!;
  expect(column.children[17]).toHaveTextContent('七');
  expect(container.querySelector('[data-slot="number-animation-digit"]')).toHaveAttribute('data-digit-glyph', '〇');
});
