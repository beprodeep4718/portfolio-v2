import "@/components/iso/iso.css";
import "./parsr.css";
import { PARSR_PLATE } from "./art.generated";
import { ParsrLive } from "./parsr-live";

/**
 * Parsr drawn as a card sorter (built by figures/parsr/build.mjs --emit).
 * The static art is server HTML; ParsrLive only moves it.
 */
export function ParsrFigure() {
  return (
    <div className="parsr iso">
      <div dangerouslySetInnerHTML={{ __html: PARSR_PLATE }} />
      <ParsrLive />
    </div>
  );
}
