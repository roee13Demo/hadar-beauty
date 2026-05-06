import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";
// Use the edge runtime — the Node runtime hits a Windows fileURLToPath bug
// in @vercel/og when loading the default font.
export const runtime = "edge";

/** App icon — 4-petal bloom on brand gradient. Used for favicon + PWA manifest. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #c4a090 0%, #9C7A6F 50%, #C9A96E 100%)",
          position: "relative",
        }}
      >
        {/* Top petal */}
        <div
          style={{
            position: "absolute",
            top: 58,
            left: 186,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Bottom petal */}
        <div
          style={{
            position: "absolute",
            top: 314,
            left: 186,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Left petal */}
        <div
          style={{
            position: "absolute",
            top: 186,
            left: 58,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Right petal */}
        <div
          style={{
            position: "absolute",
            top: 186,
            left: 314,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Center circle — white ring */}
        <div
          style={{
            position: "relative",
            width: 172,
            height: 172,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.90)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Center dot — accent gradient */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #9C7A6F 0%, #C9A96E 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
