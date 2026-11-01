import { render, screen } from '@testing-library/react';
import { Progress, ProgressCircle, ProgressValue } from './progress';

it.each([Progress, ProgressCircle])('updates plain values by default and only rolls when requested', (Root) => {
  const { container, rerender } = render(<Root value={25}><ProgressValue data-testid="readout" /></Root>);
  expect(screen.getByTestId('readout')).toHaveTextContent('25%');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  rerender(<Root value={30}><ProgressValue data-testid="readout" /></Root>);
  expect(screen.getByTestId('readout')).toHaveTextContent('30%');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  rerender(<Root value={40}><ProgressValue animated /></Root>);
  expect(container.querySelector('[data-slot="number-animation"]')).toHaveAttribute('data-animated');
  rerender(<Root value={50}><ProgressValue animated={false} data-testid="readout" /></Root>);
  expect(screen.getByTestId('readout')).toHaveTextContent('50%');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
});

it.each([Progress, ProgressCircle])('keeps animated percentages, custom formats, and indeterminate values in sync', (Root) => {
  const { container, rerender } = render(<Root min={10} max={30} value={15} locale="de-DE"><ProgressValue animated /></Root>);
  const text = () => container.querySelector('[data-slot="number-animation-text"]')?.textContent;
  expect(text()).toBe(new Intl.NumberFormat('de-DE', { style: 'percent' }).format(0.25));
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', text());

  const format = { style: 'currency', currency: 'EUR' } as const;
  rerender(<Root min={10} max={30} value={99} locale="de-DE" format={format}><ProgressValue animated /></Root>);
  expect(text()).toBe(new Intl.NumberFormat('de-DE', format).format(30));
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', text());

  rerender(<Root value={null}><ProgressValue animated /></Root>);
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
});
