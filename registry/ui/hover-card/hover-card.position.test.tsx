import { act, render, waitFor } from "@testing-library/react";
import { useHoverCardSideLock } from "./hover-card.position";

type Side="top"|"bottom"|"left"|"right";
function Harness({open=true,actual="bottom",preferred="bottom",enabled=true,hidden=false}: {
  open?:boolean;actual?:Side;preferred?:Side;enabled?:boolean;hidden?:boolean;
}) {
  const {ref,lockedSide}=useHoverCardSideLock(preferred,enabled);
  return <div ref={ref} data-testid="positioner" data-open={open ? "" : undefined} data-side={actual}
    style={{visibility:hidden ? "hidden" : undefined}}><span data-testid="lock">{lockedSide ?? "unlocked"}</span></div>;
}

it("waits for initial positioning and retains its resolved side through content movement", async () => {
  const view=render(<Harness hidden />);
  await act(async()=>{await new Promise(resolve=>requestAnimationFrame(resolve))});
  expect(view.getByTestId('lock')).toHaveTextContent('unlocked');
  view.rerender(<Harness actual="top" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('top'));
  view.rerender(<Harness actual="bottom" />);
  await act(async()=>{await new Promise(resolve=>requestAnimationFrame(resolve))});
  expect(view.getByTestId('lock')).toHaveTextContent('top');
});

it("resets on close even when kept mounted and resolves the next opening again", async () => {
  const view=render(<Harness actual="top" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('top'));
  const element=view.getByTestId('positioner');
  view.rerender(<Harness open={false} actual="top" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('unlocked'));
  view.rerender(<Harness actual="bottom" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('bottom'));
  expect(view.getByTestId('positioner')).toBe(element);
});

it("recalculates a new preferred side and allows locking to be disabled", async () => {
  const view=render(<Harness actual="top" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('top'));
  view.rerender(<Harness preferred="right" actual="left" />);
  await waitFor(()=>expect(view.getByTestId('lock')).toHaveTextContent('left'));
  view.rerender(<Harness preferred="right" actual="left" enabled={false} />);
  expect(view.getByTestId('lock')).toHaveTextContent('unlocked');
});

it("does not lock a card that closes before its positioning frame runs", async () => {
  const view=render(<Harness />);
  view.rerender(<Harness open={false} />);
  await act(async()=>{await new Promise(resolve=>requestAnimationFrame(resolve))});
  expect(view.getByTestId('lock')).toHaveTextContent('unlocked');
});
