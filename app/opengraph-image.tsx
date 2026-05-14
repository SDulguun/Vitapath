import { ImageResponse } from "next/og";

export const alt = "VitaPath. Vitamins that fit your day.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#F7F3EB";
const INK = "#14201A";
const INK_SOFT = "#354539";
const SAGE = "#5A8068";
const SAGE_SOFT = "#D5E2D8";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -60,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: SAGE_SOFT,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 60,
            width: 88,
            height: 88,
            borderRadius: 999,
            background: SAGE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 44,
            fontFamily: "Georgia, serif",
            fontWeight: 500,
            fontStyle: "italic",
          }}
        >
          V
        </div>

        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: INK,
            fontWeight: 700,
            display: "flex",
          }}
        >
          VitaPath
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 860,
          }}
        >
          <div
            style={{
              fontSize: 104,
              color: INK,
              fontWeight: 500,
              lineHeight: 1.04,
              fontFamily: "Georgia, serif",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span>Vitamins that</span>
            <span style={{ fontStyle: "italic" }}>fit</span>
            <span>your day.</span>
          </div>
          <div
            style={{
              fontSize: 30,
              color: INK_SOFT,
              fontWeight: 400,
              display: "flex",
            }}
          >
            Explainable health score. Cited picks. Real studies.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
