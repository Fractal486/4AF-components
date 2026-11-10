import { matchesKeybind } from "./command-palette.keybinds";

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });

it.each([
  ["shift+/", { key: "?", code: "Slash", shiftKey: true }],
  ["shift+1", { key: "!", code: "Digit1", shiftKey: true }],
  ["ctrl+shift+1", { key: "!", code: "Digit1", shiftKey: true, ctrlKey: true }],
  ["shift+;", { key: ":", code: "Semicolon", shiftKey: true }],
  ["+", { key: "+", code: "Equal", shiftKey: true }],
  ["+", { key: "+", code: "NumpadAdd" }],
  ["mod++", { key: "+", code: "Equal", ctrlKey: true, shiftKey: true }],
  ["shift++", { key: "+", code: "Equal", shiftKey: true }],
  ["mod+k", { key: "k", ctrlKey: true }],
  ["⌘K", { key: "k", metaKey: true }],
] as const)("matches %s with the browser's produced key", (binding, init) => {
  expect(matchesKeybind(binding, key(init))).toBe(true);
});

it.each([
  ["shift+1", { key: "!", code: "Digit2", shiftKey: true }],
  ["shift+/", { key: "/", code: "Slash" }],
  ["1", { key: "!", code: "Digit1", shiftKey: true }],
  ["shift+a", { key: "Q", code: "KeyA", shiftKey: true }],
  ["+", { key: "=", code: "Equal" }],
  ["+", { key: "+", code: "NumpadAdd", altKey: true }],
  ["ctrl+", { key: "+", code: "Equal", ctrlKey: true }],
  ["mod+k", { key: "k", ctrlKey: true, repeat: true }],
  ["mod+k", { key: "k", ctrlKey: true, isComposing: true }],
] as const)("rejects mismatched or ignored events for %s", (binding, init) => {
  expect(matchesKeybind(binding, key(init))).toBe(false);
});

it.each([
  '<button><span>Button child</span></button>',
  '<a href="#target"><span>Link child</span></a>',
  '<div role="button"><span>Button role child</span></div>',
  '<div role="link"><span>Link role child</span></div>',
  '<div role="textbox"><span>Textbox child</span></div>',
  '<div contenteditable="true"><span>Editable child</span></div>',
  '<input>', '<textarea></textarea>', '<select></select>',
])("does not steal unmodified keys from %s", html => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  try {
    const target = host.querySelector("span") ?? host.firstElementChild!;
    let matched = true;
    host.addEventListener("keydown", event => { matched = matchesKeybind("Enter", event); });
    target.dispatchEvent(key({ key: "Enter" }));
    expect(matched).toBe(false);
  } finally { host.remove(); }
});

it("allows unmodified keys in page content and explicit chords on controls", () => {
  const button = document.createElement("button");
  document.body.append(button);
  try {
    let matched = false;
    button.addEventListener("keydown", event => { matched = matchesKeybind("mod+s", event); });
    button.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(matched).toBe(true);
    expect(matchesKeybind("Enter", key({ key: "Enter" }))).toBe(true);
    const prevented = key({ key: "Enter" });
    prevented.preventDefault();
    expect(matchesKeybind("Enter", prevented)).toBe(false);
  } finally { button.remove(); }
});
