import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, BadgeClose, BadgeDot, BadgeCount } from './badge';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function(this: HTMLElement) {
    return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
  });
});
afterEach(() => vi.restoreAllMocks());

it('keeps the removal action in the accessible name with a supplied ID and respects label overrides', () => {
  const { rerender } = render(<Badge>Design<BadgeClose id="remove-design" /></Badge>);
  expect(screen.getByRole('button', { name: 'Remove Design' })).toHaveAttribute('id', 'remove-design');
  rerender(<Badge>Design<BadgeClose id="dismiss-design" /></Badge>);
  expect(screen.getByRole('button', { name: 'Remove Design' })).toHaveAttribute('id', 'dismiss-design');
  rerender(<Badge>Design<BadgeClose id="remove-design" aria-label="Dismiss tag" /></Badge>);
  expect(screen.getByRole('button', { name: 'Dismiss tag' })).not.toHaveAttribute('aria-labelledby');
  rerender(<><span id="dismiss-label">Clear selection</span><Badge>Design<BadgeClose id="remove-design" aria-labelledby="dismiss-label" /></Badge></>);
  expect(screen.getByRole('button', { name: 'Clear selection' })).toHaveAttribute('aria-labelledby', 'dismiss-label');
});

it('removes with Delete, names the close button, and focuses the next tag', async () => {
  const user = userEvent.setup(); const complete = vi.fn();
  render(<div><Badge onOpenChangeComplete={complete}>Design<BadgeClose /></Badge><Badge>Research<BadgeClose /></Badge></div>);
  const close = screen.getByRole('button', {name:'Remove Design'});
  close.focus(); await user.keyboard('{Delete}');
  await waitFor(() => expect(close).not.toBeInTheDocument());
  expect(screen.getByRole('button', {name:'Remove Research'})).toHaveFocus();
  expect(complete).toHaveBeenCalledWith(false);
});

it('cancels removal from click or visibility callbacks without stealing focus', async () => {
  const user = userEvent.setup(); const changed=vi.fn();
  const {rerender}=render(<Badge onOpenChange={changed}>Design<BadgeClose onClick={event=>event.preventDefault()} /></Badge>);
  await user.click(screen.getByRole('button',{name:'Remove Design'}));
  expect(changed).not.toHaveBeenCalled();
  rerender(<Badge onOpenChange={(_,details)=>details.cancel()}>Design<BadgeClose /></Badge>);
  await user.click(screen.getByRole('button',{name:'Remove Design'}));
  expect(screen.getByRole('button',{name:'Remove Design'})).toHaveFocus();
});

it('allows controlled dismissal to be ignored, applied later, and reopened', async () => {
  const user=userEvent.setup(); const changed=vi.fn();
  const view=(open:boolean)=><Badge open={open} onOpenChange={changed}>Design<BadgeClose /></Badge>;
  const {rerender}=render(view(true));
  await user.click(screen.getByRole('button',{name:'Remove Design'}));
  expect(changed).toHaveBeenCalledWith(false, expect.any(Object));
  expect(screen.getByRole('button',{name:'Remove Design'})).toBeVisible();
  rerender(view(false)); await waitFor(()=>expect(screen.queryByRole('button',{name:'Remove Design'})).toBeNull());
  rerender(view(true));expect(screen.getByRole('button',{name:'Remove Design'})).toBeVisible();
});

it('forwards custom rendering, refs and handlers without duplicating controls', async () => {
  const user=userEvent.setup(); const ref=createRef<HTMLSpanElement>(); const clicked=vi.fn();
  const {rerender}=render(<Badge ref={ref} render={<button onClick={clicked} type="button" />} aria-invalid>Filter</Badge>);
  expect(ref.current).toBe(screen.getByRole('button',{name:'Filter'}));
  await user.click(screen.getByRole('button',{name:'Filter'}));expect(clicked).toHaveBeenCalledTimes(1);
  expect(ref.current).toHaveAttribute('aria-invalid','true');
  rerender(<Badge render={(props,state)=><a {...props} href="#target" data-visible={state.open} />}>Link</Badge>);
  expect(screen.getByRole('link',{name:'Link'})).toHaveAttribute('data-visible','true');
});

it('provides independent neutral text, opaque fill and dot pulse options', () => {
  const {container}=render(<Badge variant="filled" status="success" neutralText><BadgeDot pulse />Live</Badge>);
  const badge=container.querySelector('[data-slot=badge]');
  expect(badge).toHaveClass('bg-success','text-success-foreground');
  expect(badge).toHaveAttribute('data-neutral-text');
  expect(container.querySelectorAll('[data-slot=badge-dot]')).toHaveLength(1);
  expect(container.querySelector('[data-slot=badge-dot]')).toHaveAttribute('data-pulse');
});

it('caps visual counts while exposing the full formatted value and forwarding refs', () => {
  const ref=createRef<HTMLSpanElement>();
  const {container,rerender}=render(<Badge showIcon={false}><BadgeCount ref={ref} value={1234} animated={false} locales="en-US" /></Badge>);
  expect(ref.current).toBe(container.querySelector('[data-slot=badge-count]'));
  expect(container.querySelector('[data-slot=badge-count-value]')).toHaveTextContent('99+');
  expect(ref.current?.lastElementChild).toHaveTextContent('1,234');
  rerender(<BadgeCount value={1234} max={Infinity} animated={false} locales="de-DE" format={{useGrouping:true}} />);
  expect(container.querySelector('[data-slot=badge-count-value]')).toHaveTextContent('1.234');
  rerender(<BadgeCount value={NaN} />);expect(container.querySelector('[data-slot=badge-count-value]')).toHaveTextContent('0');
  rerender(<BadgeCount value={-12} />);expect(container.querySelector('[data-slot=badge-count-value]')).toHaveTextContent('0');
});

it('keeps count contents and close controls out of Morph sizing copies', () => {
  const {container}=render(<Badge><BadgeCount value={7} /><BadgeClose aria-label="Clear unread" /></Badge>);
  expect(container.querySelectorAll('[data-slot=badge-count]')).toHaveLength(1);
  expect(screen.getAllByRole('button',{name:'Clear unread'})).toHaveLength(1);
  expect(container.querySelector('[data-slot=badge-count]')?.closest('[data-slot=morph]')).toBeNull();
});

it('keeps count animation off until explicitly enabled', () => {
  const { container, rerender } = render(<BadgeCount value={8} />);
  const count = () => container.querySelector('[data-slot="number-animation"]');
  expect(count()).toBeNull();
  rerender(<BadgeCount value={9} />);
  expect(count()).toBeNull();
  rerender(<BadgeCount value={10} animated />);
  expect(count()).toHaveAttribute('data-animated');
  rerender(<BadgeCount value={11} animated={false} />);
  expect(count()).toBeNull();
});
