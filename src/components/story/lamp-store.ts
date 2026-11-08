/**
 * The one lamp, shared between the hero and the story lamp.
 *
 * The hero decides where the lamp rests (the full stop, or the cursor) and
 * writes it to `home` in the hero's own coordinates. The story lamp carries it
 * from there down the page and writes where it actually is to `final`, in
 * viewport coordinates, so the hero can keep lighting the letters and the
 * circuit board under the lamp while it falls away.
 */
export const lampStore = {
  home: { x: 0, y: 0, size: 0, ready: false, el: null as HTMLElement | null },
  final: { x: 0, y: 0, size: 0, active: false },
  /** 0 to 1: how brightly the prologue is lit, which widens the lamp's halo */
  glow: 0,
};
