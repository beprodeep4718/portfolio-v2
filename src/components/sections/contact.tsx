import { contact, primaryCta, site } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { LitText } from "@/components/story/lit-text";
import { RevealText } from "@/components/story/reveal-text";
import { RiseGroup } from "@/components/story/rise-group";
import { CopyEmail } from "./copy-email";

function mailto(email: string) {
  const params = new URLSearchParams({ subject: contact.emailSubject, body: contact.emailBody });
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}

export function Contact() {
  const linkedin = site.socials.find((s) => s.icon === "linkedin")!;
  const hasEmail = site.email.length > 0;

  return (
    <section id="contact" data-chapter="contact" aria-labelledby="contact-title" className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[22%] -z-10 aspect-square w-[640px] max-w-[80vw] rounded-full bg-[radial-gradient(circle,var(--halo)_0%,transparent_62%)]"
      />
      <div className="container-page flex flex-col gap-8 pt-30 pb-12">
        <h2 id="contact-title" className="display-contact text-ink">
          <RevealText>{contact.heading}</RevealText>
          {/* Where the story lamp comes to rest */}
          <span aria-hidden="true" data-dock="contact" className="lamp ml-[0.05em] size-[0.16em]" />
        </h2>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-6 border-t border-rule pt-8">
          <LitText text={contact.body} className="type-body-lg min-w-0 flex-[1_1_420px] text-muted" />
          {hasEmail ? (
            <>
              <a href={mailto(site.email)} className={buttonClass("primary")}>
                {primaryCta.label}
              </a>
              <CopyEmail email={site.email} />
            </>
          ) : (
            <a href={linkedin.href} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
              Message me on LinkedIn<span className="sr-only">, opens in a new tab</span>
            </a>
          )}
        </div>

        <RiseGroup as="ul" className="flex flex-wrap gap-x-7 gap-y-1">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring type-body-sm inline-flex min-h-11 items-center rounded-sm text-ink underline decoration-line decoration-2 underline-offset-[6px] transition-colors hover:decoration-lamp"
              >
                {s.label}
                <span className="sr-only">, opens in a new tab</span>
              </a>
            </li>
          ))}
        </RiseGroup>
      </div>
    </section>
  );
}
