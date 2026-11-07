import { primaryCta, services } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="container-page flex flex-wrap gap-x-16 gap-y-10 py-20">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col items-start gap-6">
        <h2 id="services-title" className="display-section text-ink">
          {services.heading}
        </h2>
        <a href={primaryCta.href} className={buttonClass("primary")}>
          {primaryCta.label}
        </a>
      </div>

      <ul className="flex min-w-0 flex-[2_1_560px] flex-col border-b border-line">
        {services.items.map((item, i) => (
          <li
            key={item.title}
            className={cn("flex flex-wrap gap-x-8 gap-y-2 border-t py-6", i === 0 ? "border-rule" : "border-line")}
          >
            <h3 className="type-item min-w-0 flex-[1_1_240px] text-ink">{item.title}</h3>
            <p className="type-body min-w-0 flex-[2_1_300px] text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
