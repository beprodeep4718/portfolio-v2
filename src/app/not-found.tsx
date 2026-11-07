import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <main id="main" tabIndex={-1} className="flex min-h-[80svh] items-center outline-none">
        <div className="container-page flex flex-col items-start gap-8 py-24">
          <p className="type-mono text-muted">Error 404</p>
          <h1 className="display-section max-w-[900px] text-ink md:text-[clamp(56px,8vw,128px)]">
            Even with a lamp, there is nothing down here
            <span aria-hidden="true" className="lamp ml-[0.05em] size-[0.16em]" />
          </h1>
          <p className="type-body-lg max-w-[560px] text-muted">
            The link may be old or mistyped. Everything I have built is on the home page.
          </p>
          <Link href="/" className={buttonClass("primary")}>
            Back to home
          </Link>
        </div>
      </main>
      <Footer home={false} />
    </>
  );
}
