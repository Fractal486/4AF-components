import { fireEvent, waitFor } from "@testing-library/react";
import { observePinnedColumnFades } from "./table-scroll-fade";

function rect(left: number, width: number, scale = 1) {
  return { x: left * scale, left: left * scale, right: (left + width) * scale, width: width * scale, y: 0, top: 0, bottom: 36 * scale, height: 36 * scale, toJSON() {} } as DOMRect;
}

it.each([false, true])('measures leaf columns below grouped headings with pinned gutters in RTL=%s', async (rtl) => {
  const viewport = document.createElement('div');
  viewport.style.width = '500px';
  viewport.style.direction = rtl ? 'rtl' : 'ltr';
  viewport.innerHTML = `<table><thead>
    <tr><th data-pinned="start">Select</th><th colspan="3">Person</th><th data-pinned="end">Actions</th></tr>
    <tr><th data-pinned="start">Select</th><th data-pinned="start">Name</th><th>Details</th><th data-pinned="end">Total</th><th data-pinned="end">Actions</th></tr>
    </thead><tbody><tr><td data-pinned="start">Select Ada</td><th data-pinned="start">Ada</th><td>Engineer</td><td data-pinned="end">12</td><td data-pinned="end">Edit</td></tr></tbody></table>`;
  document.body.append(viewport);
  const table = viewport.querySelector('table')!;
  const leaf = table.rows[1]!;
  let gutterWidth = 40;
  viewport.getBoundingClientRect = () => rect(0, 500);
  for (const row of Array.from(table.rows)) row.getBoundingClientRect = () => rect(rtl ? -120 : -80, 700);
  const cellRect = (start: number, width: number) => rect(rtl ? 500 - start - width : start, width);
  table.rows[0]!.cells[0]!.getBoundingClientRect = () => cellRect(0, gutterWidth);
  table.rows[0]!.cells[1]!.getBoundingClientRect = () => cellRect(gutterWidth - 80, 600);
  table.rows[0]!.cells[2]!.getBoundingClientRect = () => cellRect(440, 60);
  leaf.cells[0]!.getBoundingClientRect = () => cellRect(0, gutterWidth);
  leaf.cells[1]!.getBoundingClientRect = () => cellRect(gutterWidth, 100);
  leaf.cells[2]!.getBoundingClientRect = () => cellRect(60, 400);
  leaf.cells[3]!.getBoundingClientRect = () => cellRect(340, 100);
  leaf.cells[4]!.getBoundingClientRect = () => cellRect(440, 60);
  const cleanup = observePinnedColumnFades(viewport, table);
  try {
    for (const row of [leaf, table.rows[2]!]) {
      expect(row.cells[1]!.style.getPropertyValue('--table-auto-pin-offset')).toBe('40.000px');
      expect(row.cells[3]!.style.getPropertyValue('--table-auto-pin-offset')).toBe('60.000px');
    }
    expect(viewport.style.getPropertyValue('--table-pinned-start')).toBe('140.000px');
    expect(viewport.style.getPropertyValue('--table-pinned-end')).toBe('160.000px');
    gutterWidth = 48;
    leaf.cells[0]!.style.width = '48px';
    await waitFor(() => expect(leaf.cells[1]!.style.getPropertyValue('--table-auto-pin-offset')).toBe('48.000px'));
    table.tBodies[0]!.innerHTML = '<tr><td data-pinned="start">Select</td><td colspan="3">No results</td><td data-pinned="end"></td></tr>';
    fireEvent.scroll(viewport);
    await waitFor(() => expect(viewport.style.getPropertyValue('--table-pinned-start')).toBe('148.000px'));
    expect(leaf.cells[3]!.style.getPropertyValue('--table-auto-pin-offset')).toBe('60.000px');
  } finally { cleanup(); viewport.remove(); }
});

it.each([false, true].flatMap(rtl => [1, 1.25, 4].map(scale => ({ rtl, scale }))))(
  "places both fades inside pinned groups in RTL=$rtl at scale=$scale",
  ({ rtl, scale }) => {
    const viewport = document.createElement("div");
    viewport.style.width = "500px";
    viewport.style.direction = rtl ? "rtl" : "ltr";
    viewport.innerHTML = '<table><thead><tr><th data-pinned="start">Name</th><th>Details</th><th data-pinned="end">Total</th></tr></thead></table>';
    document.body.append(viewport);
    const table = viewport.querySelector("table")!;
    const row = table.rows[0]!;
    viewport.getBoundingClientRect = () => rect(10, 500, scale);
    row.getBoundingClientRect = () => rect(rtl ? -110 : -70, 700, scale);
    const boxes: [number, number][] = rtl ? [[410, 100], [-10, 500], [10, 100]] : [[10, 100], [30, 500], [410, 100]];
    Array.from(row.cells).forEach((cell, i) => { cell.getBoundingClientRect = () => rect(boxes[i]![0], boxes[i]![1], scale); });
    const cleanup = observePinnedColumnFades(viewport, table);
    try {
      expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe("100.000px");
      expect(viewport.style.getPropertyValue("--table-pinned-end")).toBe("100.000px");
      expect(viewport.style.getPropertyValue("--table-hidden-start")).toBe("80.000px");
      expect(viewport.style.getPropertyValue("--table-hidden-end")).toBe("120.000px");
    } finally { cleanup(); viewport.remove(); }
  },
);

it("waits until content moves behind a pinned column, then follows scrolling and removes stale edges", async () => {
  const viewport = document.createElement("div");
  viewport.style.width = "500px";
  viewport.style.setProperty("--table-pinned-start", "2px");
  viewport.innerHTML = '<table><tbody><tr><td>Checkbox</td><td data-pinned="start">Name</td><td>Details</td></tr></tbody></table>';
  document.body.append(viewport);
  const table = viewport.querySelector("table")!;
  const row = table.rows[0]!;
  let scroll = 20;
  viewport.getBoundingClientRect = () => rect(0, 500);
  row.getBoundingClientRect = () => rect(-scroll, 640);
  row.cells[0]!.getBoundingClientRect = () => rect(-scroll, 40);
  row.cells[1]!.getBoundingClientRect = () => rect(Math.max(0, 40 - scroll), 100);
  row.cells[2]!.getBoundingClientRect = () => rect(140 - scroll, 500);
  const cleanup = observePinnedColumnFades(viewport, table);
  try {
    expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe("120.000px");
    expect(viewport.style.getPropertyValue("--table-hidden-start")).toBe("0.000px");
    expect(viewport.style.getPropertyValue("--table-hidden-end")).toBe("");
    scroll = 60;
    fireEvent.scroll(viewport);
    await waitFor(() => expect(viewport.style.getPropertyValue("--table-hidden-start")).toBe("20.000px"));
    expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe("100.000px");
    row.cells[1]!.removeAttribute("data-pinned");
    await waitFor(() => expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe(""));
  } finally { cleanup(); viewport.remove(); }
  expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe("2px");
  expect(viewport.style.getPropertyValue("--table-hidden-start")).toBe("");
});

it("keeps internal joins opaque when multiple columns are pinned on one side", () => {
  const viewport = document.createElement("div");
  viewport.style.width = "500px";
  viewport.innerHTML = '<table><thead><tr><th data-pinned="start">Name</th><th data-pinned="start">Role</th><th>Details</th></tr></thead></table>';
  document.body.append(viewport);
  const table = viewport.querySelector("table")!;
  const row = table.rows[0]!;
  viewport.getBoundingClientRect = () => rect(0, 500);
  row.getBoundingClientRect = () => rect(-80, 700);
  row.cells[0]!.getBoundingClientRect = () => rect(0, 100);
  row.cells[1]!.getBoundingClientRect = () => rect(100, 120);
  row.cells[2]!.getBoundingClientRect = () => rect(140, 480);
  const cleanup = observePinnedColumnFades(viewport, table);
  try {
    expect(viewport.style.getPropertyValue("--table-pinned-start")).toBe("220.000px");
    expect(viewport.style.getPropertyValue("--table-hidden-start")).toBe("80.000px");
  } finally { cleanup(); viewport.remove(); }
});
it("automatically spaces end pins, follows resized widths, and preserves explicit offsets", async () => {
  const viewport = document.createElement("div");
  viewport.style.width = "500px";
  viewport.innerHTML = '<table><thead><tr><th>Details</th><th data-pinned="end">Total</th><th data-pinned="end">Actions</th></tr></thead><tbody><tr><td>Text</td><td data-pinned="end">12</td><td data-pinned="end">Edit</td></tr></tbody></table>';
  document.body.append(viewport);
  const table = viewport.querySelector("table")!;
  const row = table.rows[0]!;
  let outerWidth = 80;
  viewport.getBoundingClientRect = () => rect(0, 500);
  row.getBoundingClientRect = () => rect(-50, 700);
  row.cells[0]!.getBoundingClientRect = () => rect(-50, 500);
  row.cells[1]!.getBoundingClientRect = () => rect(300, 120);
  row.cells[2]!.getBoundingClientRect = () => rect(420, outerWidth);
  table.rows[1]!.cells[1]!.style.setProperty("--table-pin-offset", "90px");
  const cleanup = observePinnedColumnFades(viewport, table);
  try {
    expect(row.cells[1]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("80.000px");
    expect(row.cells[2]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("0.000px");
    expect(table.rows[1]!.cells[1]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("80.000px");
    expect(table.rows[1]!.cells[1]!.style.getPropertyValue("--table-pin-offset")).toBe("90px");
    outerWidth = 110;
    row.cells[2]!.style.width = "110px";
    await waitFor(() => expect(row.cells[1]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("110.000px"));
    row.cells[2]!.removeAttribute("data-pinned");
    table.rows[1]!.cells[2]!.removeAttribute("data-pinned");
    await waitFor(() => expect(row.cells[1]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("0.000px"));
    expect(row.cells[2]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("");
  } finally { cleanup(); viewport.remove(); }
  expect(row.cells[1]!.style.getPropertyValue("--table-auto-pin-offset")).toBe("");
  expect(table.rows[1]!.cells[1]!.style.getPropertyValue("--table-pin-offset")).toBe("90px");
});
