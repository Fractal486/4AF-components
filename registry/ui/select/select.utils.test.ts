import { resumeFromActiveRow } from "./select.utils";

describe.each(["option", "menuitemradio", "menuitemcheckbox"])("resume from an active %s", (role) => {
  function panel() {
    const list = document.createElement("div");
    list.tabIndex = -1;
    list.innerHTML = `<button role="${role}">First</button>
      <button role="${role}" data-panel-active>Active</button>
      <button role="${role}" data-disabled>Data disabled</button>
      <button role="${role}" aria-disabled="true">Aria disabled</button>
      <button role="${role}" disabled>Native disabled</button>
      <div hidden><button role="${role}">Hidden group</button></div>
      <button role="${role}" hidden>Hidden row</button>
      <button role="${role}">Last</button>`;
    document.body.append(list);
    list.focus();
    return list;
  }

  afterEach(() => { document.body.replaceChildren(); });

  it("skips disabled and search-hidden rows in both directions", () => {
    const list = panel();
    expect(resumeFromActiveRow(list, "ArrowDown", `[role="${role}"]`)).toBe(true);
    expect(document.activeElement).toHaveTextContent("Last");
    list.focus();
    expect(resumeFromActiveRow(list, "ArrowUp", `[role="${role}"]`)).toBe(true);
    expect(document.activeElement).toHaveTextContent("First");
  });

  it("leaves focused rows, unrelated keys, and lists without an active row to Base UI", () => {
    const list = panel();
    const active = list.querySelector<HTMLElement>("[data-panel-active]")!;
    const child = document.createElement("span");
    child.tabIndex = -1;
    active.append(child);
    child.focus();
    expect(resumeFromActiveRow(list, "ArrowDown", `[role="${role}"]`)).toBe(false);
    list.focus();
    expect(resumeFromActiveRow(list, "Enter", `[role="${role}"]`)).toBe(false);
    active.removeAttribute("data-panel-active");
    expect(resumeFromActiveRow(list, "ArrowDown", `[role="${role}"]`)).toBe(false);
    expect(resumeFromActiveRow(null, "ArrowDown", `[role="${role}"]`)).toBe(false);
  });

  it("clamps at the edges without wrapping", () => {
    const list = panel();
    list.querySelector("[data-panel-active]")!.removeAttribute("data-panel-active");
    list.firstElementChild!.setAttribute("data-panel-active", "");
    expect(resumeFromActiveRow(list, "ArrowUp", `[role="${role}"]`)).toBe(true);
    expect(document.activeElement).toHaveTextContent("First");
    list.firstElementChild!.removeAttribute("data-panel-active");
    list.lastElementChild!.setAttribute("data-panel-active", "");
    list.focus();
    expect(resumeFromActiveRow(list, "ArrowDown", `[role="${role}"]`)).toBe(true);
    expect(document.activeElement).toHaveTextContent("Last");
  });
});
