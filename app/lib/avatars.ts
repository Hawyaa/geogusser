// ============================================================
// lib/avatars.ts — Original flat-illustrated avatar definitions
// ============================================================
// 8 simple, original chibi-style character face avatars rendered
// as inline SVG. No external assets, no copyrighted character
// designs — just geometric shapes (circle face, simple hair shape,
// dot eyes) varied by color and silhouette.
// ============================================================

export interface AvatarDef {
  id: string;
  name: string;
  skinTone: string;
  hairColor: string;
  hairStyle: "short" | "long" | "bun" | "spiky" | "curly" | "bald" | "bob" | "afro";
  outfitColor: string;
}

export const AVATARS: AvatarDef[] = [
  { id: "av_1", name: "Nova",   skinTone: "#F0C8A0", hairColor: "#2B2B2B", hairStyle: "bob",   outfitColor: "#22c55e" },
  { id: "av_2", name: "Orbit",  skinTone: "#C98A5E", hairColor: "#1A1A2E", hairStyle: "spiky",  outfitColor: "#3b82f6" },
  { id: "av_3", name: "Comet",  skinTone: "#F5D6B8", hairColor: "#7C4A2D", hairStyle: "long",   outfitColor: "#ec4899" },
  { id: "av_4", name: "Atlas",  skinTone: "#8C5A3C", hairColor: "#0F0F0F", hairStyle: "bald",   outfitColor: "#f97316" },
  { id: "av_5", name: "Lumen",  skinTone: "#E8B894", hairColor: "#D4A017", hairStyle: "curly",  outfitColor: "#a855f7" },
  { id: "av_6", name: "Vega",   skinTone: "#FAD8B8", hairColor: "#E63946", hairStyle: "bun",    outfitColor: "#06b6d4" },
  { id: "av_7", name: "Drift",  skinTone: "#7A4A2E", hairColor: "#2B2B2B", hairStyle: "afro",   outfitColor: "#eab308" },
  { id: "av_8", name: "Zephyr", skinTone: "#F0C8A0", hairColor: "#5C4A8A", hairStyle: "short",  outfitColor: "#ef4444" },
];

export function getAvatarById(id: string | null | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

// ─── Hair shape paths, keyed by style ──────────────────────────────────────
// Drawn in a 100x100 viewBox with the face circle centered at (50, 52) r=32.
function hairPath(style: AvatarDef["hairStyle"]): string {
  switch (style) {
    case "bob":
      return "M18 50 Q18 14 50 14 Q82 14 82 50 L82 58 Q74 46 68 58 L66 40 Q50 30 34 40 L32 58 Q26 46 18 58 Z";
    case "spiky":
      return "M16 48 L24 22 L32 42 L40 16 L50 40 L60 16 L68 42 L76 22 L84 48 Q84 18 50 16 Q16 18 16 48 Z";
    case "long":
      return "M16 50 Q16 12 50 12 Q84 12 84 50 L84 86 Q76 80 74 60 L72 50 Q50 28 28 50 L26 60 Q24 80 16 86 Z";
    case "bald":
      return "";
    case "curly":
      return "M20 46 Q14 30 24 24 Q22 12 36 14 Q42 4 54 10 Q66 4 72 16 Q84 14 82 28 Q90 36 82 46 Q84 20 50 18 Q16 20 20 46 Z";
    case "bun":
      return "M18 50 Q18 14 50 14 Q82 14 82 50 L80 56 Q76 30 50 26 Q24 30 20 56 Z M42 10 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0";
    case "afro":
      return "M50 10 a38 38 0 1 0 0.1 0 Z M50 18 a30 30 0 1 1 -0.1 0 Z";
    case "short":
    default:
      return "M18 48 Q18 14 50 14 Q82 14 82 48 L80 54 Q76 28 50 24 Q24 28 20 54 Z";
  }
}

// ─── Render a single avatar as an inline SVG string ────────────────────────
// Kept in sync with AvatarIcon.tsx's JSX version — same shapes, same
// proportions. This string version exists for any non-React context that
// might need a raw SVG (e.g. a future <img src="data:image/svg+xml..."> use).
// The actual app renders avatars via the AvatarIcon component, not this.
export function avatarSvg(def: AvatarDef, size = 64): string {
  const isAfro = def.hairStyle === "afro";
  const hair = hairPath(def.hairStyle);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="98" r="28" fill="${def.outfitColor}" />
      ${isAfro ? `<circle cx="50" cy="34" r="32" fill="${def.hairColor}" />` : ""}
      <circle cx="50" cy="50" r="33" fill="${def.skinTone}" />
      ${!isAfro && hair ? `<path d="${hair}" fill="${def.hairColor}" />` : ""}
      <ellipse cx="30" cy="58" rx="5" ry="3.2" fill="#ff8fa3" opacity="0.35" />
      <ellipse cx="70" cy="58" rx="5" ry="3.2" fill="#ff8fa3" opacity="0.35" />
      <ellipse cx="38" cy="52" rx="6.2" ry="7.4" fill="#1f2937" />
      <ellipse cx="62" cy="52" rx="6.2" ry="7.4" fill="#1f2937" />
      <circle cx="40.2" cy="48.5" r="2" fill="white" />
      <circle cx="64.2" cy="48.5" r="2" fill="white" />
      <circle cx="36" cy="55" r="1.1" fill="white" opacity="0.8" />
      <circle cx="60" cy="55" r="1.1" fill="white" opacity="0.8" />
      <path d="M40 64 Q50 73 60 64 Q60 70 50 71 Q40 70 40 64 Z" fill="#7a2331" />
      <path d="M41 64.5 Q50 71.5 59 64.5 Q59 65.5 50 66.5 Q41 65.5 41 64.5 Z" fill="white" />
      <path d="M58 65 L59.6 64.2 L58.6 67.4 Z" fill="white" />
    </svg>
  `.trim();
}