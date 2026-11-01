import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import {
  HoverCard, HoverCardContent, HoverCardTrigger, HoverCardPortal, HoverCardPositioner,
  HoverCardPopup, createHoverCardHandle,
} from "./hover-card";

it("preserves popup and positioner state classes, custom rendering, DOM props, and refs", async () => {
  const popupRef=createRef<HTMLDivElement>(), positionerRef=createRef<HTMLDivElement>(), portalRef=createRef<HTMLDivElement>();
  const tree=(open:boolean)=><HoverCard open={open}>
    <HoverCardTrigger href="#">Profile</HoverCardTrigger>
    <HoverCardContent ref={popupRef} render={<section data-custom="preview" />} contentClassName="space-y-2"
      className={state=>state.open ? "is-open" : "is-closed"}
      portalProps={{keepMounted:true,ref:portalRef}}
      positionerProps={{ref:positionerRef,className:state=>state.open ? "positioned" : "resting"}}>
      Profile contents
    </HoverCardContent>
  </HoverCard>;
  const {rerender}=render(tree(true));
  await waitFor(()=>expect(popupRef.current).toHaveClass("is-open"));
  const popup=popupRef.current!;
  expect(popup.tagName).toBe("SECTION");
  expect(popup).toHaveAttribute("data-custom","preview");
  expect(popup).toHaveClass("bg-surface","wrap-anywhere");
  expect(positionerRef.current).toHaveClass("z-50","positioned");
  expect(portalRef.current).toContainElement(popup);
  expect(popup.querySelector('[data-slot="hover-card-body"]')).toHaveClass("space-y-2");
  rerender(tree(false));
  await waitFor(()=>expect(popup).toHaveClass("is-closed"));
  expect(popupRef.current).toBe(popup);
});

it("uses a custom portal container and retains child state while closed", async () => {
  const user=userEvent.setup();
  function Counter(){const [count,setCount]=useState(0);return <button data-testid="counter" onClick={()=>setCount(count+1)}>Count {count}</button>}
  const container=document.createElement('div');document.body.appendChild(container);
  const tree=(open:boolean)=><HoverCard open={open}><HoverCardTrigger href="#">Profile</HoverCardTrigger>
    <HoverCardContent portalProps={{container,keepMounted:true}}><Counter /></HoverCardContent>
  </HoverCard>;
  try{
    const {rerender}=render(tree(true));const counter=await screen.findByTestId('counter');
    expect(container).toContainElement(counter);await user.click(counter);expect(counter).toHaveTextContent('Count 1');
    rerender(tree(false));await waitFor(()=>expect(container.querySelector('[data-slot="hover-card-content"]')).toHaveAttribute('data-closed'));
    expect(counter).toBeInTheDocument();rerender(tree(true));
    expect(screen.getByTestId('counter')).toBe(counter);expect(counter).toHaveTextContent('Count 1');
  }finally{container.remove()}
});

it("shares one popup across detached typed triggers without retaining outgoing content", async () => {
  const user=userEvent.setup();
  function Shared(){const [handle]=useState(()=>createHoverCardHandle<{name:string}>());return <>
    <HoverCardTrigger href="#alex" delay={0} handle={handle} payload={{name:"Alex"}}>Alex</HoverCardTrigger>
    <HoverCardTrigger href="#taylor" delay={0} handle={handle} payload={{name:"Taylor"}}>Taylor</HoverCardTrigger>
    <HoverCard handle={handle}>{({payload})=><HoverCardContent><p>{payload?.name} profile</p></HoverCardContent>}</HoverCard>
  </>}
  render(<Shared />);
  await user.hover(screen.getByRole('link',{name:'Alex'}));await screen.findByText('Alex profile');
  const popup=document.querySelector('[data-slot="hover-card-content"]');
  await user.hover(screen.getByRole('link',{name:'Taylor'}));await screen.findByText('Taylor profile');
  expect(document.querySelector('[data-slot="hover-card-content"]')).toBe(popup);
  expect(screen.queryByText('Alex profile')).not.toBeInTheDocument();
  expect(document.querySelectorAll('[data-slot="hover-card-content"]')).toHaveLength(1);
});

it("updates loading in place and restores the preview", async () => {
  const custom=<span>Fetching profile</span>;
  const tree=(loading:boolean)=><HoverCard open><HoverCardTrigger href="#">Profile</HoverCardTrigger>
    <HoverCardContent loading={loading} loadingContent={custom}><p>Loaded profile</p></HoverCardContent>
  </HoverCard>;
  const {rerender}=render(tree(true));
  expect(await screen.findByText('Fetching profile')).toBeInTheDocument();
  const popup=document.querySelector('[data-slot="hover-card-content"]');expect(popup).toHaveAttribute('aria-busy','true');
  rerender(tree(false));expect(await screen.findByText('Loaded profile')).toBeInTheDocument();
  expect(document.querySelector('[data-slot="hover-card-content"]')).toBe(popup);
  expect(popup).not.toHaveAttribute('aria-busy');expect(screen.queryByText('Fetching profile')).not.toBeInTheDocument();
});

it("supports separately composed parts and explicit height ownership", async () => {
  const popupRef=createRef<HTMLDivElement>();
  render(<HoverCard open><HoverCardTrigger href="#">Profile</HoverCardTrigger>
    <HoverCardPortal><HoverCardPositioner lockSide={false} align="start">
      <HoverCardPopup ref={popupRef} autoSize={false} style={{height:240}}><p>Custom composition</p></HoverCardPopup>
    </HoverCardPositioner></HoverCardPortal>
  </HoverCard>);
  await screen.findByText('Custom composition');
  expect(popupRef.current).toHaveStyle({height:'240px'});
  expect(popupRef.current).not.toHaveAttribute('data-auto-size');
  expect(popupRef.current?.querySelector('[data-slot="hover-card-scroll-area"]')).toBeInTheDocument();
  expect(popupRef.current?.parentElement).not.toHaveAttribute('data-side-locked');
});

it("preserves controlled and cancellable state changes", async () => {
  const user=userEvent.setup();const changed=vi.fn();const complete=vi.fn();
  function Controlled(){const [open,setOpen]=useState(false);return <HoverCard open={open} onOpenChange={(next,details)=>{
    changed(next,details.reason);if(details.reason==='escape-key')details.cancel();else setOpen(next);
  }} onOpenChangeComplete={complete}>
    <HoverCardTrigger href="#" delay={0}>Profile</HoverCardTrigger><HoverCardContent>Preview</HoverCardContent>
  </HoverCard>}
  render(<Controlled />);await user.hover(screen.getByRole('link',{name:'Profile'}));
  await screen.findByText('Preview');await user.keyboard('{Escape}');
  expect(changed).toHaveBeenCalledWith(false,'escape-key');
  expect(screen.getByText('Preview').closest('[data-slot="hover-card-content"]')).toHaveAttribute('data-open');
  expect(complete).toHaveBeenCalledWith(true);
});

it("keeps keyboard focus on the link and dismisses on Escape", async () => {
  const user=userEvent.setup();render(<HoverCard><HoverCardTrigger href="#" delay={0}>Profile</HoverCardTrigger>
    <HoverCardContent>Preview</HoverCardContent>
  </HoverCard>);
  await user.tab();await screen.findByText('Preview');expect(screen.getByRole('link')).toHaveFocus();
  await user.keyboard('{Escape}');await waitFor(()=>expect(screen.queryByText('Preview')).not.toBeInTheDocument());
  expect(screen.getByRole('link')).toHaveFocus();
});
