import { site } from "@/content/site";
import { Dock } from "@/components/dock";
import { Hero } from "@/components/hero/hero";
import { Prologue } from "@/components/sections/prologue";
import { Work } from "@/components/sections/work";
import { Stack } from "@/components/sections/stack";
import { Now } from "@/components/sections/now";
import { Services } from "@/components/sections/services";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/footer";
import { StoryLamp } from "@/components/story/story-lamp";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Full stack engineer",
  worksFor: { "@type": "Organization", name: "MindWebs Ventures" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Jalpaiguri Government Engineering College" },
  address: { "@type": "PostalAddress", addressLocality: "Jalpaiguri", addressRegion: "West Bengal", addressCountry: "IN" },
  sameAs: site.socials.map((s) => s.href),
};

export default function Home() {
  return (
    <>
      <Dock />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Prologue />
        <Work />
        <Stack />
        <Now />
        <Services />
        <Contact />
      </main>
      <Footer />
      <StoryLamp />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
