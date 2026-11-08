import { layers } from "@/content/site";
import { cn } from "@/lib/cn";
import { RevealText } from "@/components/story/reveal-text";
import { TechLogo } from "@/components/ui/tech-logo";
import { StackLayers } from "./stack-layers";

/* Each layer is darker than the one above it */
const tone = [
  { band: "bg-l1 text-l1-ink", muted: "text-l1-muted" },
  { band: "bg-l2 text-l2-ink", muted: "text-l2-muted" },
  { band: "bg-l3 text-l3-ink", muted: "text-l3-muted" },
  { band: "bg-l4 text-l4-ink", muted: "text-l4-muted" },
];

/**
 * The story lamp sinks through the four layers on its rail. Each layer lists
 * its tools with their marks; the marks in the layer the lamp is in take its
 * light.
 */
export function Stack() {
  return (
    <section id="stack" data-chapter="stack" aria-labelledby="stack-title" className="pt-12">
      <div className="container-page flex flex-wrap items-end justify-between gap-x-12 gap-y-4 pb-12">
        <h2 id="stack-title" className="display-section text-ink">
          <RevealText>How deep I go</RevealText>
        </h2>
        <p className="type-body max-w-[460px] text-muted">
          Four layers, one person. This is what I reach for at each depth. The lamp sinks through them as you scroll.
        </p>
      </div>

      <StackLayers>
        {layers.map((layer, i) => (
          <li
            key={layer.title}
            data-stack-layer
            data-reached="true"
            data-active="false"
            className={cn("group relative", tone[i].band)}
          >
            <div className="container-page flex flex-wrap items-start gap-x-10 gap-y-3 py-11">
              <span
                className={cn(
                  "type-mono basis-full transition-colors duration-500 lg:basis-12 lg:pt-3",
                  tone[i].muted,
                  "group-data-[active=true]:font-semibold group-data-[active=true]:text-current",
                )}
              >
                <span className="sr-only">Layer </span>
                {layer.depth}
              </span>
              <h3 className="display-layer min-w-0 flex-[1_1_240px] transition-opacity duration-700 group-data-[reached=false]:opacity-30">
                {layer.title}
              </h3>
              <p
                className={cn(
                  "min-w-0 flex-[1_1_240px] text-[19px] leading-[1.45] transition-opacity duration-700 group-data-[reached=false]:opacity-30",
                  tone[i].muted,
                )}
              >
                {layer.what}
              </p>
              <ul className="flex min-w-0 flex-[1_1_280px] flex-wrap gap-x-5 gap-y-3 transition-opacity duration-700 group-data-[reached=false]:opacity-30 lg:pt-1">
                {layer.tools.map((tool) => (
                  <li key={tool} className="type-body-sm inline-flex items-center gap-2">
                    <TechLogo
                      name={tool}
                      className="size-5 transition-colors duration-500 group-data-[active=true]:text-lamp"
                    />
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </StackLayers>
    </section>
  );
}
