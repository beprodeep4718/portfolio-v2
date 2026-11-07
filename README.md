# Beprodeep Das · Portfolio V2

Personal site built around one idea: **light in the darkness**, which is what the name Beprodeep means. A lamp carries that light deep into the stack.

- **Hero**: the name set huge with a lamp as its full stop. On a mouse the lamp follows the cursor and warms the letters it passes; a Three.js field of dust motes glows around it. Wherever the light falls it reveals a generated two layer circuit board (chips, buses, passives, vias, silkscreen) with signals and data packets such as `I2C 0x3C` and `GET /api` running along the copper (`src/components/hero/circuit.ts`).
- **Shipped**: an index of projects; rows open to a screenshot and links, and four bars show how far down the stack each one goes.
- **How deep I go**: the stack as four layers that get darker with depth. The lamp sinks down the rail as you scroll (GSAP ScrollTrigger).
- **Now**, **services** and **Say hello**, with a live Jalpaiguri clock.
- **Light and dark mode**: follows the system setting, remembers the visitor's choice, and is applied before paint so it never flashes.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React Three Fiber, Motion, GSAP, Lenis. Type: Inter Tight, with JetBrains Mono for readouts.

## Run it

```bash
npm install
npm run dev
```

## Edit the content

All copy, projects, layers and links live in `src/content/site.ts`. Before launch, fill in the `TODO` items:

1. `email`: until it is set, the contact button opens LinkedIn.
2. `now.items` → `Learning`: left empty, the row is hidden.
3. Anjusa Academy and Early2Code: `live`, `code` and `image` (screenshots go in `public/work/`).
4. Set `NEXT_PUBLIC_SITE_URL` to the real domain.

Colors for both themes are CSS variables at the top of `src/app/globals.css`.
