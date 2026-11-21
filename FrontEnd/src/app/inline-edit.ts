import { signal } from '@angular/core';

export type EditKey = number | 'new';

// samain dengan durasi expand di styles.css
const DURATION = 320;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

export class InlineEdit {
  readonly mounted = signal<EditKey | null>(null);
  readonly open = signal<EditKey | null>(null);
  private run = 0;

  constructor(private readonly prefix: string) {}

  anchorId(key: EditKey): string {
    return `${this.prefix}-${key}`;
  }

  async show(key: EditKey, prepare?: () => void): Promise<void> {
    const run = ++this.run;

    
    if (this.mounted() !== null && this.mounted() !== key) {
      this.open.set(null);
      await wait(DURATION);
      if (run !== this.run) return;
    }

    prepare?.();
    this.mounted.set(key);

    // kasi 2 frame biar lebih smooth waktu tutup di browser
    await nextFrame();
    await nextFrame();
    if (run !== this.run) return;
    this.open.set(key);

    await wait(DURATION);
    if (run !== this.run) return;
    this.reveal(key);
  }

  hide(): void {
    const run = ++this.run;
    this.open.set(null);
    setTimeout(() => {
      if (run === this.run) this.mounted.set(null);
    }, DURATION);
  }

  private reveal(key: EditKey): void {
    const card = document.getElementById(this.anchorId(key));
    if (!card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    card.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
  }
}
