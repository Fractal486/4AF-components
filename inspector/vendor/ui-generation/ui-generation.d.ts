export interface GenerationRun {
  finished: Promise<HTMLElement>;
  cancel(): void;
  element: HTMLElement;
}

export function generate(
  element: HTMLElement,
  options?: { mode?: "skeleton" | "skeleton-texts"; container?: HTMLElement },
): GenerationRun;
