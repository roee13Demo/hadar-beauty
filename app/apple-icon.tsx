import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// Use the edge runtime — the Node runtime hits a Windows fileURLToPath bug
// in @vercel/og when loading the default font.
export const runtime = "edge";

/** Apple Touch Icon — same bloom design at 180×180 for iOS home screen. */
export default function AppleIcon() {
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
            top: 20,
            left: 65,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Bottom petal */}
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 65,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Left petal */}
        <div
          style={{
            position: "absolute",
            top: 65,
            left: 20,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Right petal */}
        <div
          style={{
            position: "absolute",
            top: 65,
            left: 110,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
          }}
        />
        {/* Center */}
        <div
          style={{
            position: "relative",
            width: 62,
            height: 62,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.90)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #9C7A6F 0%, #C9A96E 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
