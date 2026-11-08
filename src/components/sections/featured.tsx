import Image from "next/image";
import { featured } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { DepthBars } from "@/components/ui/depth-bars";
import { ParsrFigure } from "@/components/parsr/parsr-figure";
import { PipelineScene } from "@/components/parsr/pipeline-scene";
import { LitText } from "@/components/story/lit-text";
import { RiseGroup } from "@/components/story/rise-group";

export function Featured() {
  return (
    <article
      id={`work-${featured.slug}`}
      aria-labelledby="featured-title"
      className="grid scroll-mt-28 gap-8 border-t border-rule pt-8"
    >
      {/* Grid, not flex: a pinned scene needs a non-flex parent to get its scroll room */}
      <PipelineScene>
        <div className="grid w-full items-center gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-5">
            <div className="flex flex-col gap-3">
              <p className="type-mono flex items-center gap-2 text-muted">
                <span aria-hidden="true" className="lamp-dot size-2" />
                {featured.kicker}
              </p>
              <h3 id="featured-title" className="display-section text-ink">
                {featured.title}
              </h3>
            </div>
            <LitText manual text={featured.summary} className="type-body text-ink" />

            {/* A row of data travels down the steps as the scene plays */}
            <ol data-pipe aria-label="How a file moves through Parsr" className="relative flex flex-col gap-3 pl-8">
              <span aria-hidden="true" data-pipe-line className="absolute top-2 bottom-2 left-[6px] w-px bg-line" />
              <span aria-hidden="true" data-pipe-fill className="absolute top-0 left-[6px] h-0 w-px bg-lamp" />
              <span aria-hidden="true" data-pipe-dot className="lamp-dot absolute top-0 left-px z-10 size-[11px] opacity-0" />
              {featured.steps.map((step, i) => (
                <li key={step.title} data-pipe-step className="relative flex gap-3 transition-opacity duration-300">
                  <span
                    aria-hidden="true"
                    data-pipe-mark
                    className="absolute top-[5px] -left-8 size-[13px] rounded-full border-2 border-line bg-bg transition-colors duration-300"
                  />
                  <span className="type-mono w-6 shrink-0 pt-0.5 text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <p className="type-small min-w-0 text-muted">
                    <span data-pipe-title className="font-semibold text-ink transition-colors duration-300">
                      {step.title}.
                    </span>{" "}
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            <ParsrFigure />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {featured.metrics.map((m) => (
                <div key={m.label} className="flex flex-col gap-0.5">
                  <dt className="type-small order-2 text-muted">{m.label}</dt>
                  <dd className="type-row order-1 text-ink tabular-nums">
                    <span className="sr-only">{m.value}</span>
                    <span aria-hidden="true" data-count={m.value}>
                      {m.value}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href={featured.code} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
                Read the code<span className="sr-only"> for Parsr on GitHub, opens in a new tab</span>
              </a>
              <span className="type-mono flex items-center gap-3 text-muted">
                <DepthBars depth={featured.depth} />
                All four stack layers
              </span>
            </div>
          </div>
        </div>
      </PipelineScene>

      <RiseGroup as="ul" className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Screenshots of Parsr">
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
      </RiseGroup>

      <p className="type-small -mt-2 text-muted">Built with {featured.stack}</p>
    </article>
  );
}
