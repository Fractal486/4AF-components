import { act, render } from "@testing-library/react";
import { usePopoverHeight } from "./popover.height";

let height = 100;
let observers: { callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn> }[];

beforeEach(() => {
  height = 100;
  observers = [];
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function(this:HTMLElement) {
    return this.dataset.slot === "sizer" ? height : 0;
  });
  vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  vi.stubGlobal("ResizeObserver", class {
    disconnect = vi.fn();
    constructor(callback:ResizeObserverCallback) { observers.push({callback,disconnect:this.disconnect}); }
    observe() {}
    unobserve() {}
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Harness({enabled=true, max=300}:{enabled?:boolean;max?:number}) {
  const measure = usePopoverHeight();
  return <div data-testid="positioner"><div data-popover-frame="" data-testid="popup"
    style={{height:70,maxHeight:max,padding:10,border:"1px solid",boxSizing:"border-box"}}>
    <div data-slot="sizer" ref={enabled ? measure : undefined}>Content</div>
  </div></div>;
}
const resize = () => act(() => observers[0]!.callback([], {} as ResizeObserver));

it("measures natural content and shrinks back after reaching the height limit", () => {
  const view = render(<Harness />);
  const popup = view.getByTestId("popup");
  expect(popup.style.height).toBe("122px");
  height = 600; resize();
  expect(popup.style.height).toBe("300px");
  height = 80; resize();
  expect(popup.style.height).toBe("102px");
});

it("reclaims available space even when the constrained panel itself has not resized", async () => {
  height = 600;
  const view = render(<Harness />);
  const popup = view.getByTestId("popup");
  view.rerender(<Harness max={500} />);
  await act(async () => { view.getByTestId("positioner").style.setProperty("--available-height", "500px"); });
  expect(popup.style.height).toBe("500px");
});

it("tracks continuous changes directly and restores transitions after they settle", () => {
  vi.useFakeTimers();
  try {
    const view = render(<Harness />);
    vi.advanceTimersByTime(120);
    height = 120; resize();
    expect(view.getByTestId("popup")).not.toHaveAttribute("data-resizing");
    height = 135; resize();
    expect(view.getByTestId("popup")).toHaveAttribute("data-resizing");
    act(() => vi.advanceTimersByTime(81));
    expect(view.getByTestId("popup")).not.toHaveAttribute("data-resizing");
  } finally { vi.useRealTimers(); }
});

it("cleans observers and restores the caller's height when automatic sizing is disabled", () => {
  const view = render(<Harness />);
  const popup = view.getByTestId("popup");
  expect(popup.style.height).toBe("122px");
  view.rerender(<Harness enabled={false} />);
  expect(observers[0]!.disconnect).toHaveBeenCalled();
  expect(popup.style.height).toBe("70px");
  expect(popup).not.toHaveAttribute("data-resizing");
});

it("keeps scrollbars suppressed until the height transition ends, not unrelated transitions", () => {
  vi.useFakeTimers();
  try {
    const view=render(<Harness />);
    const popup=view.getByTestId("popup");
    popup.style.transitionProperty="opacity, height";
    popup.style.transitionDuration="0.1s, 600ms";
    vi.advanceTimersByTime(100);
    height=180;resize();
    expect(popup).toHaveAttribute("data-sizing");
    const end=(propertyName:string)=>{
      const event=new Event("transitionend",{bubbles:true});
      Object.defineProperty(event,"propertyName",{value:propertyName});
      popup.dispatchEvent(event);
    };
    end("opacity");expect(popup).toHaveAttribute("data-sizing");
    act(()=>vi.advanceTimersByTime(350));expect(popup).toHaveAttribute("data-sizing");
    end("height");expect(popup).not.toHaveAttribute("data-sizing");
  } finally { vi.useRealTimers(); }
});

it("does not reveal scrollbars on a cancelled transition before its replacement settles", () => {
  vi.useFakeTimers();
  try {
    const view=render(<Harness />);
    const popup=view.getByTestId("popup");
    popup.style.transitionProperty="height";popup.style.transitionDuration="200ms";
    vi.advanceTimersByTime(100);height=160;resize();
    vi.advanceTimersByTime(100);height=200;resize();
    const realComputedStyle=window.getComputedStyle;
    const computed=vi.spyOn(window,"getComputedStyle").mockImplementation(element=>{
      const style=realComputedStyle(element);
      return element===popup ? new Proxy(style,{get:(target,key)=>key==="height" ? "170px" : Reflect.get(target,key)}) : style;
    });
    const cancel=new Event("transitioncancel",{bubbles:true});
    Object.defineProperty(cancel,"propertyName",{value:"height"});popup.dispatchEvent(cancel);
    expect(popup).toHaveAttribute("data-sizing");
    computed.mockRestore();
    act(()=>vi.advanceTimersByTime(151));expect(popup).toHaveAttribute("data-sizing");
    act(()=>vi.advanceTimersByTime(100));expect(popup).not.toHaveAttribute("data-sizing");
    view.rerender(<Harness enabled={false} />);
    expect(popup).not.toHaveAttribute("data-sizing");
  } finally { vi.useRealTimers(); }
});
