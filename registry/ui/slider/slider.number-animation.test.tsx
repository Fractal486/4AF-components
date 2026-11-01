import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './slider';

it('updates plain values by default and allows animation to be opted in and out', () => {
  const { container, rerender } = render(<Slider label="Volume" value={25} />);
  expect(container.querySelector('output')).toHaveTextContent('25');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  rerender(<Slider label="Volume" value={30} />);
  expect(container.querySelector('output')).toHaveTextContent('30');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  rerender(<Slider label="Volume" value={40} animateValue />);
  expect(container.querySelector('[data-slot="number-animation"]')).toHaveAttribute('data-animated');
  rerender(<Slider label="Volume" value={50} animateValue={false} disabled />);
  expect(container.querySelector('output')).toHaveTextContent('50');
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
});

it('rolls both range values with the root format, including disabled readouts', () => {
  const format = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as const;
  const { container, rerender } = render(<Slider animateValue label="Price" value={[20, 80]} locale="de-DE" format={format} />);
  const values = () => Array.from(container.querySelectorAll('[data-slot="number-animation-text"]'), node => node.textContent);
  const expected = (low: number, high: number) => [low, high].map(value => new Intl.NumberFormat('de-DE', format).format(value));
  expect(values()).toEqual(expected(20, 80));
  rerender(<Slider animateValue label="Price" value={[30, 90]} disabled locale="de-DE" format={format} />);
  expect(values()).toEqual(expected(30, 90));
  expect(screen.getAllByRole('slider').map(input => input.getAttribute('aria-valuetext'))).toEqual([
    `${expected(30, 90)[0]} start range`, `${expected(30, 90)[1]} end range`,
  ]);
});

it('keeps the plain input editor and resumes the animated readout after committing', async () => {
  const user = userEvent.setup();
  const { container } = render(<Slider animateValue label="Volume" defaultValue={25} />);
  await user.click(container.querySelector('[data-slot="number-animation"]')!);
  const input = screen.getByRole('textbox', { name: 'Edit Volume' });
  expect(container.querySelector('[data-slot="number-animation"]')).toBeNull();
  await user.clear(input);
  await user.type(input, '42{Enter}');
  expect(container.querySelector('[data-slot="number-animation-text"]')).toHaveTextContent('42');
  expect(screen.getByRole('slider')).toHaveValue('42');
});
