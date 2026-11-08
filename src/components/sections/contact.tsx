import Image from "next/image";
import { GithubLogo, InstagramLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { contact, primaryCta, site } from "@/content/site";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LitText } from "@/components/story/lit-text";
import { RevealText } from "@/components/story/reveal-text";
import { RiseGroup } from "@/components/story/rise-group";
import { CopyEmail } from "./copy-email";

function mailto(email: string) {
  const params = new URLSearchParams({ subject: contact.emailSubject, body: contact.emailBody });
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}

/* One icon set for all three, so the marks share a weight */
const socialLogo = { linkedin: LinkedinLogo, github: GithubLogo, instagram: InstagramLogo };

export function Contact() {
  const linkedin = site.socials.find((s) => s.icon === "linkedin")!;
  const hasEmail = site.email.length > 0;
  const photo = site.photo.src ? site.photo : null;

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

        <div className={cn("grid items-start gap-x-12 gap-y-8 border-t border-rule pt-8", photo && "lg:grid-cols-12")}>
          <div className={cn("flex min-w-0 flex-col gap-8", photo && "lg:col-span-8")}>
            <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
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
              {site.socials.map((s) => {
                const Logo = socialLogo[s.icon];
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social focus-ring type-body-sm inline-flex min-h-11 items-center gap-2 rounded-sm text-ink underline decoration-line decoration-2 underline-offset-[6px] transition-colors hover:decoration-lamp"
                    >
                      <Logo
                        aria-hidden="true"
                        weight="fill"
                        className="size-5 shrink-0 transition-colors duration-300 group-hover/social:text-lamp"
                      />
                      {s.label}
                      <span className="sr-only">, opens in a new tab</span>
                    </a>
                  </li>
                );
              })}
            </RiseGroup>
          </div>

          {/* The last thing the lamp lights: dark until it lands on the full stop above, then lit from its side.
              On a phone it comes first, between the heading and the message. */}
          {photo ? (
            <figure className="order-first m-0 flex w-full max-w-sm flex-col gap-3 lg:order-none lg:col-span-4 lg:max-w-none">
              <div data-lamp-lit className="lamp-photo relative aspect-[4/5] overflow-hidden rounded-md bg-[#0d1017]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 400px, 384px"
                  className="lamp-photo-image object-cover"
                />
                <span aria-hidden="true" className="lamp-photo-warm absolute inset-0" />
                <span aria-hidden="true" className="lamp-photo-shade absolute inset-0" />
              </div>
              <figcaption className="type-mono text-muted">{photo.caption}</figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
