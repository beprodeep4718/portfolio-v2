import Image from "next/image";
import { featured } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { DepthBars } from "@/components/ui/depth-bars";
import { ParsrFigure } from "@/components/parsr/parsr-figure";

export function Featured() {
  return (
    <article
      id={`work-${featured.slug}`}
      aria-labelledby="featured-title"
      className="flex scroll-mt-28 flex-col gap-6 border-t border-rule pt-8"
    >
      <header className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
          <p className="type-mono flex items-center gap-2 text-muted">
            <span aria-hidden="true" className="lamp-dot size-2" />
            {featured.kicker}
          </p>
          <h3 id="featured-title" className="display-section text-ink">
            {featured.title}
          </h3>
          <p className="type-body text-muted">{featured.summary}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
            <a href={featured.code} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
              Read the code<span className="sr-only"> for Parsr on GitHub, opens in a new tab</span>
            </a>
            <span className="type-mono flex items-center gap-3 text-muted">
              <DepthBars depth={featured.depth} />
              All four stack layers
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-5 lg:col-span-5 lg:pt-8">
          {featured.metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5">
              <dt className="type-small order-2 text-muted">{m.label}</dt>
              <dd className="type-row order-1 text-ink tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid items-center gap-x-10 gap-y-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <ParsrFigure />
        </div>
        <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
          {featured.steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="type-mono w-6 shrink-0 pt-0.5 text-muted">{String(i + 1).padStart(2, "0")}</span>
              <p className="type-small min-w-0 text-muted">
                <span className="font-semibold text-ink">{step.title}.</span> {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Screenshots of Parsr">
        {featured.shots.map((shot) => (
          <li key={shot.src}>
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-line bg-[#0b0b10]">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(min-width: 1024px) 300px, 50vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="type-mono text-muted">{shot.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <p className="type-small -mt-2 text-muted">Built with {featured.stack}</p>
    </article>
  );
}
