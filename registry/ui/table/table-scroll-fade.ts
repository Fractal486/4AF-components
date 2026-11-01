const VARIABLES = ["--table-pinned-start", "--table-pinned-end", "--table-hidden-start", "--table-hidden-end"] as const;

/** Keep the Scroll Area's horizontal fade immediately inside the pinned columns. */
export function observePinnedColumnFades(viewport: HTMLDivElement, table: HTMLTableElement) {
  const previous = VARIABLES.map((name) => ({ name, value: viewport.style.getPropertyValue(name), priority: viewport.style.getPropertyPriority(name) }));
  let frame = 0;
  let watched: Element[] = [];
  let pinSignature = "";
  let pinStructureChanged = true;
  const autoPinned = new Set<HTMLElement>();
  let emptyContent: HTMLElement | null = null;
  const write = (name: string, value: number | undefined) => {
    if (value === undefined) viewport.style.removeProperty(name);
    else {
      const next = value.toFixed(3) + "px";
      if (viewport.style.getPropertyValue(name) !== next) viewport.style.setProperty(name, next);
    }
  };
  const direction = new MutationObserver(schedule);
  for (let ancestor: HTMLElement | null = viewport; ancestor; ancestor = ancestor.parentElement) {
    direction.observe(ancestor, { attributes: true, attributeFilter: ["dir"] });
  }
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  const mutation = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList" || ["data-pinned", "colspan", "rowspan"].includes(record.attributeName ?? ""))) pinStructureChanged = true;
    schedule();
  });

  function measure() {
    // Group headings may pin only a selection/actions gutter. Prefer a complete leaf
    // row, starting at the bottom of the header so empty/loading tables work too.
    // HTMLTableElement.rows excludes nested tables; absolute selection bars aren't columns.
    const flowCells = (row: HTMLTableRowElement) => Array.from(row.cells).filter((cell) => getComputedStyle(cell).position !== "absolute");
    const hasPins = table.querySelector("th[data-pinned], td[data-pinned]");
    const headers = hasPins ? Array.from(table.tHead?.rows ?? []) : [];
    const columnCount = Math.max(0, ...headers.map((row) => flowCells(row).reduce((count, cell) => count + cell.colSpan, 0)));
    const rows = hasPins ? [...headers.reverse(), ...Array.from(table.rows).filter((row) => row.parentElement !== table.tHead)] : [];
    const row = rows.find((row) => {
      const cells = flowCells(row);
      return cells.length >= columnCount && cells.every((cell) => cell.colSpan === 1 && cell.rowSpan === 1) && cells.some((cell) => cell.dataset.pinned);
    }) ?? rows.find((row) => flowCells(row).some((cell) => cell.dataset.pinned));
    const cells = row ? flowCells(row) : [];
    // Widths drive automatic logical offsets; scroll position does not. Reapply only
    // when column geometry or table structure changes, keeping scroll work to one row.
    const signature = cells.map((cell) => [cell.dataset.pinned, cell.getBoundingClientRect().width, cell.style.getPropertyValue("--table-pin-offset")].join(":")).join(";");
    if (pinStructureChanged || signature !== pinSignature) {
      pinStructureChanged = false;
      pinSignature = signature;
      for (const cell of autoPinned) {
        if (!table.contains(cell) || !cell.dataset.pinned) { cell.style.removeProperty("--table-auto-pin-offset"); autoPinned.delete(cell); }
      }
      const scale = viewport.getBoundingClientRect().width / (parseFloat(getComputedStyle(viewport).width) || viewport.clientWidth || 1) || 1;
      const offsets: Record<string, number[]> = { start: [], end: [] };
      for (const side of ["start", "end"] as const) {
        const group = cells.filter((cell) => cell.dataset.pinned === side);
        if (side === "end") group.reverse();
        let offset = 0;
        for (const cell of group) {
          offsets[side]!.push(offset);
          const custom = cell.style.getPropertyValue("--table-pin-offset");
          const resolved = custom ? parseFloat(getComputedStyle(cell)[side === "start" ? "insetInlineStart" : "insetInlineEnd"]) : offset;
          offset = (Number.isFinite(resolved) ? resolved : offset) + cell.getBoundingClientRect().width / scale;
        }
      }
      for (const tableRow of Array.from(table.rows)) for (const side of ["start", "end"] as const) {
        const group = Array.from(tableRow.cells).filter((cell) => cell.dataset.pinned === side);
        if (side === "end") group.reverse();
        group.forEach((cell, index) => {
          const value = (offsets[side]![index] ?? 0).toFixed(3) + "px";
          if (cell.style.getPropertyValue("--table-auto-pin-offset") !== value) cell.style.setProperty("--table-auto-pin-offset", value);
          autoPinned.add(cell);
        });
      }
    }
    const targets: Element[] = [viewport, table, ...cells];
    if (targets.length !== watched.length || targets.some((target, i) => target !== watched[i])) {
      resize?.disconnect();
      mutation.disconnect();
      targets.forEach((target) => resize?.observe(target));
      mutation.observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-pinned", "colspan", "rowspan", "dir"] });
      cells.forEach((cell) => mutation.observe(cell, { attributes: true, attributeFilter: ["data-pinned", "colspan", "rowspan", "style", "class"] }));
      watched = targets;
    }

    // An empty cell spans the data columns, which can extend beyond the scrollport
    // and start after a checkbox gutter. Keep its content centered in the visible
    // viewport, without changing the table's column widths or removing native cells.
    emptyContent = table.querySelector<HTMLElement>('[data-slot="table-empty-content"]');
    if (emptyContent) {
      const bounds = viewport.getBoundingClientRect();
      const width = parseFloat(getComputedStyle(viewport).width) || viewport.clientWidth;
      if (bounds.width > 0 && width > 0) {
        const nextWidth = width.toFixed(3) + "px";
        if (emptyContent.style.getPropertyValue("--table-empty-width") !== nextWidth) emptyContent.style.setProperty("--table-empty-width", nextWidth);
        const scale = bounds.width / width;
        const current = parseFloat(emptyContent.style.getPropertyValue("--table-empty-x")) || 0;
        const next = (current + (bounds.left - emptyContent.getBoundingClientRect().left) / scale).toFixed(3) + "px";
        if (emptyContent.style.getPropertyValue("--table-empty-x") !== next) emptyContent.style.setProperty("--table-empty-x", next);
      }
    }
    if (!row) {
      VARIABLES.forEach((name) => write(name, undefined));
      return;
    }
    const bounds = viewport.getBoundingClientRect();
    const viewportStyle = getComputedStyle(viewport);
    const cssWidth = parseFloat(viewportStyle.width) || viewport.clientWidth;
    if (bounds.width <= 0 || cssWidth <= 0) {
      VARIABLES.forEach((name) => write(name, undefined));
      return;
    }
    const rtl = viewportStyle.direction === "rtl";
    const scale = bounds.width / cssWidth;
    const rowBounds = row.getBoundingClientRect();
    let naturalStart = rtl ? bounds.right - rowBounds.right : rowBounds.left - bounds.left;
    const edges: Partial<Record<"start" | "end", { inset: number; hidden: number }>> = {};

    for (const cell of cells) {
      const box = cell.getBoundingClientRect();
      const actualStart = rtl ? bounds.right - box.right : box.left - bounds.left;
      const actualEnd = actualStart + box.width;
      const side = cell.dataset.pinned;
      if ((side === "start" || side === "end") && actualEnd > 0 && actualStart < bounds.width) {
        const inset = side === "start" ? actualEnd : bounds.width - actualStart;
        const hidden = side === "start" ? actualStart - naturalStart : naturalStart + box.width - actualEnd;
        // Only the inner edge of a group fades. Multiple same-side pinned columns can
        // supply offsets; internal joins between them stay opaque.
        if (!edges[side] || inset > edges[side].inset) edges[side] = { inset, hidden };
      }
      naturalStart += box.width;
    }

    for (const side of ["start", "end"] as const) {
      const edge = edges[side];
      write("--table-pinned-" + side, edge ? Math.min(cssWidth, Math.max(0, edge.inset / scale)) : undefined);
      // A gutter before/after a pinned data column can scroll away before that column
      // sticks. Fade only the content actually covered, not that earlier scroll distance.
      write("--table-hidden-" + side, edge ? Math.max(0, edge.hidden / scale) : undefined);
    }
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; measure(); });
  }

  measure();
  viewport.addEventListener("scroll", schedule, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    emptyContent?.style.removeProperty("--table-empty-width");
    emptyContent?.style.removeProperty("--table-empty-x");
    autoPinned.forEach((cell) => cell.style.removeProperty("--table-auto-pin-offset"));
    viewport.removeEventListener("scroll", schedule);
    resize?.disconnect();
    mutation.disconnect();
    direction.disconnect();
    previous.forEach(({ name, value, priority }) => {
      if (value) viewport.style.setProperty(name, value, priority);
      else viewport.style.removeProperty(name);
    });
  };
}
