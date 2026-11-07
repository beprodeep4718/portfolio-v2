import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}, full stack engineer from Jalpaiguri`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#07090E",
          color: "#EDEBE7",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(255,122,26,0.28) 0%, rgba(255,122,26,0) 62%)",
          }}
        />
        <div style={{ display: "flex", fontSize: 24, color: "#8E95A3" }}>
          Jalpaiguri, West Bengal · {site.coordinates}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-end", fontSize: 148, fontWeight: 700, letterSpacing: -8, lineHeight: 0.9 }}>
            {site.name}
            <div
              style={{
                width: 24,
                height: 24,
                marginLeft: 10,
                marginBottom: 14,
                borderRadius: 9999,
                background: "radial-gradient(circle at 34% 30%, #FFF3E0 0%, #FF7A1A 46%, #AD5312 100%)",
                boxShadow: "0 0 40px rgba(255,122,26,0.8)",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#8E95A3", maxWidth: 900, lineHeight: 1.3 }}>
            I build the interface you see and the systems underneath it.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
