# Beprodeep Das · Portfolio V2

Personal site built around one idea: **light in the darkness**, which is what the name Beprodeep means. A lamp carries that light deep into the stack.

- **Hero**: the name set huge with a lamp as its full stop. On a mouse the lamp follows the cursor and warms the letters it passes; a Three.js field of dust motes glows around it. Wherever the light falls it reveals a generated two layer circuit board (chips, buses, passives, vias, silkscreen) with signals and data packets such as `I2C 0x3C` and `GET /api` running along the copper (`src/components/hero/circuit.ts`).
- **The scroll story**: as you scroll, the lamp leaves the full stop of the name, rides a rail down the left gutter through every chapter (named beside it on wide screens) and lands as the full stop of Say hello. Key sentences light up word by word as you read, headings rise into place and lists step in (`src/components/story/`, GSAP ScrollTrigger). Under reduced motion the page is still and fully lit.
- **Prologue**: what the name means, held on screen while its three lines light up and the lamp's halo widens.
- **Shipped**: Parsr (repo: StreamIngest) is featured as an isometric card-sorter machine: a job ticket (BullMQ on Redis) goes to a reader that streams the CSV tape, cards pass three validation gates, failures go to a reject tray and valid cards are filed in batches of 1,000 (MongoDB bulkWrite). On large screens the scene is held while you scroll: a row travels down the six pipeline steps, the card sorter runs to match, and the results count up. Visitors can also scrub the run with the pointer or arrow keys. Below it, an index of more work; rows open to a screenshot and links, and four bars show how far down the stack each project goes.
- **How deep I go**: the stack as four layers that get darker with depth, each tool shown with its logo ([Simple Icons](https://simpleicons.org), CC0). A layer stays dim until the story lamp reaches it, and the logos in the layer it is in take its orange light.
- **Now**, **services** and **Say hello**, with a live Jalpaiguri clock.
- **Light and dark mode**: follows the system setting, remembers the visitor's choice, and is applied before paint so it never flashes.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React Three Fiber, Motion, GSAP, Lenis. Type: Inter Tight, with JetBrains Mono for readouts.

## Run it

```bash
npm install
npm run dev
```

## Edit the content

All copy, projects, layers and links live in `src/content/site.ts`. A new tool in `layers` also needs its logo added in `src/components/ui/tech-logo.tsx`. Before launch, fill in the `TODO` items:

1. `email`: until it is set, the contact button opens LinkedIn.
2. `now.items` → `Learning`: left empty, the row is hidden.
3. Set `NEXT_PUBLIC_SITE_URL` to the real domain.

Colors for both themes are CSS variables at the top of `src/app/globals.css`.

## The Parsr figure

The figure is drawn with the [anatomy](https://skills.wheresryan.sh/anatomy) kit (`src/components/iso/`, MIT). Its source is `figures/parsr/`: `model.mjs` holds the numbers and motion, `build.mjs` draws it. After changing either, regenerate the site files:

```bash
node figures/parsr/build.mjs --emit
```

This rewrites `src/components/parsr/art.generated.ts` and `live.generated.js`, and a standalone preview at `figures/parsr/parsr.html`. Theme colors for the figure are in `src/components/parsr/parsr.css`.
