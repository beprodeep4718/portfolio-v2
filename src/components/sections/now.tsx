import { now, site } from "@/content/site";
import { Clock } from "@/components/clock";

export function Now() {
  const items = now.items.filter((item) => item.value.trim().length > 0);

  return (
    <section id="now" aria-labelledby="now-title" className="container-page flex flex-wrap gap-x-16 gap-y-10 pt-28 pb-20">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
        <h2 id="now-title" className="display-section text-ink">
          Now
        </h2>
        <p className="type-statement max-w-[460px] text-ink">{now.statement}</p>
      </div>

      <dl className="flex min-w-0 flex-[2_1_560px] flex-col border-t border-rule">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap gap-x-8 gap-y-1 border-b border-line py-[18px]">
            <dt className="type-mono w-[140px] shrink-0 leading-6 text-muted">{item.label}</dt>
            <dd className="type-body min-w-0 flex-[1_1_280px] leading-6 text-ink">{item.value}</dd>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-8 gap-y-1 border-b border-line py-[18px]">
          <dt className="type-mono w-[140px] shrink-0 leading-6 text-muted">Local time</dt>
          <dd className="type-body min-w-0 flex-[1_1_280px] leading-6 text-ink">
            <Clock /> in Jalpaiguri, India Standard Time, at {site.coordinates}
          </dd>
        </div>
      </dl>
    </section>
  );
}
