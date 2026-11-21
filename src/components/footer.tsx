import Link from "next/link";
import { site } from "@/content/site";

export function Footer({ home = true }: { home?: boolean }) {
  return (
    <footer
      className={`container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-3 pt-8 ${home ? "pb-32" : "pb-12"}`}
    >
      <p className="type-small text-muted">© 2026 {site.name}. Designed and built in Jalpaiguri.</p>
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <Link href="/privacy" className="focus-ring type-small inline-flex min-h-11 items-center rounded-sm text-muted transition-colors hover:text-ink">
          Privacy
        </Link>
        <a
          href={home ? "#top" : "/"}
          className="focus-ring type-small inline-flex min-h-11 items-center rounded-sm text-muted transition-colors hover:text-ink"
        >
          {home ? "Back to top" : "Home"}
        </a>
        <span className="type-mono text-muted">{site.coordinates}</span>
      </nav>
    </footer>
  );
}
