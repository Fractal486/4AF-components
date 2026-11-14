import { act, renderHook, waitFor } from '@testing-library/react';
import { useTextareaAutosize } from './textarea-autosize';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([0.5, 2].flatMap(scale => ['border-box', 'content-box'].map(boxSizing => ({ scale, boxSizing }))))(
  'fits wrapped content at scale=$scale with $boxSizing sizing and follows layout resizes',
  async ({ scale, boxSizing }) => {
    const field = document.createElement('textarea');
    field.style.cssText = `width:300.5px;box-sizing:${boxSizing};padding:10px;border:1px solid;line-height:20px;`;
    field.value = 'Some content that wraps across multiple lines.';
    document.body.append(field);
    const horizontalExtra = boxSizing === 'border-box' ? 0 : 22;
    const layoutWidth = () => parseFloat(field.style.width) + horizontalExtra;
    field.getClientRects = () => [{}] as unknown as DOMRectList;
    field.getBoundingClientRect = () => ({ width: layoutWidth() * scale }) as DOMRect;
    // jsdom has no text layout. Model wrapping by content width; the hook must supply
    // the same width as the live field, independent of its visual transform.
    const wrappedHeight = (width: number) => Math.ceil(3000 / (width - 22)) * 20 + 20;
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLTextAreaElement) {
      return wrappedHeight(parseFloat(this.style.width));
    });
    let notifyResize = () => {};
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { notifyResize = callback; }
      observe() {}
      disconnect() {}
    });
    const { unmount } = renderHook(() => useTextareaAutosize({ current: field }, true, 1, 100, undefined));
    try {
      const expectedHeight = () => `${wrappedHeight(layoutWidth()) + (boxSizing === 'border-box' ? 2 : -20)}px`;
      expect(field.style.height).toBe(expectedHeight());
      expect(field.style.overflowY).toBe('hidden');
      const requestFrame = vi.spyOn(window, 'requestAnimationFrame');
      act(() => notifyResize());
      expect(requestFrame).not.toHaveBeenCalled();
      field.style.width = '200.5px';
      act(() => notifyResize());
      await waitFor(() => expect(field.style.height).toBe(expectedHeight()));
    } finally { unmount(); field.remove(); }
  },
);
