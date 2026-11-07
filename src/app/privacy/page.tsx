import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name}'s portfolio handles your data.`,
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "What this site collects",
    body: "Nothing on its own. There are no cookies, no analytics and no tracking scripts. The only thing stored is your light or dark choice, kept in your own browser.",
  },
  {
    title: "When you contact me",
    body: "If you email me or message me on LinkedIn, I see the details you choose to send, such as your name, email address and project brief. I use them only to reply and to work on your project.",
  },
  {
    title: "Hosting",
    body: "The hosting provider may keep standard server logs, such as IP addresses and request times, to keep the site secure and running. I do not use these logs to identify visitors.",
  },
  {
    title: "Your choices",
    body: "Ask me at any time to delete the messages and details you have sent, and I will remove them.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <main id="main" tabIndex={-1} className="outline-none">
        <article className="container-page flex flex-col gap-10 pt-24 pb-20 md:pt-32">
          <Link
            href="/"
            className="focus-ring type-small inline-flex min-h-11 items-center self-start rounded-sm text-muted underline decoration-line underline-offset-[6px] transition-colors hover:text-ink"
          >
            Back to home
          </Link>
          <header className="flex max-w-[680px] flex-col gap-4 border-b border-rule pb-8">
            <h1 className="display-section text-ink">Privacy</h1>
            <p className="type-body-lg text-muted">
              This is a personal portfolio. It is built to show my work, not to collect data about you.
            </p>
            <p className="type-mono text-muted">Last updated 7 November 2026</p>
          </header>
          <div className="flex max-w-[680px] flex-col gap-8">
            {sections.map((s) => (
              <section key={s.title} className="flex flex-col gap-2">
                <h2 className="type-item text-ink">{s.title}</h2>
                <p className="type-body text-muted">{s.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer home={false} />
    </>
  );
}
