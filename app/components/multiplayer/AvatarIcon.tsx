import { AvatarDef } from "@/lib/avatars";

interface AvatarIconProps {
  avatar: AvatarDef;
  size?: number;
  className?: string;
}

// Renders the same shapes as avatarSvg() in lib/avatars.ts, but as real
// JSX elements instead of an HTML string — avoids dangerouslySetInnerHTML
// and lets these compose normally with Tailwind classes, hover states, etc.
function hairElement(def: AvatarDef) {
  const isAfro = def.hairStyle === "afro";
  switch (def.hairStyle) {
    case "bob":
      return <path d="M18 50 Q18 14 50 14 Q82 14 82 50 L82 58 Q74 46 68 58 L66 40 Q50 30 34 40 L32 58 Q26 46 18 58 Z" fill={def.hairColor} />;
    case "spiky":
      return <path d="M16 48 L24 22 L32 42 L40 16 L50 40 L60 16 L68 42 L76 22 L84 48 Q84 18 50 16 Q16 18 16 48 Z" fill={def.hairColor} />;
    case "long":
      return <path d="M16 50 Q16 12 50 12 Q84 12 84 50 L84 86 Q76 80 74 60 L72 50 Q50 28 28 50 L26 60 Q24 80 16 86 Z" fill={def.hairColor} />;
    case "curly":
      return <path d="M20 46 Q14 30 24 24 Q22 12 36 14 Q42 4 54 10 Q66 4 72 16 Q84 14 82 28 Q90 36 82 46 Q84 20 50 18 Q16 20 20 46 Z" fill={def.hairColor} />;
    case "bun":
      return (
        <>
          <path d="M18 50 Q18 14 50 14 Q82 14 82 50 L80 56 Q76 30 50 26 Q24 30 20 56 Z" fill={def.hairColor} />
          <circle cx="50" cy="10" r="8" fill={def.hairColor} />
        </>
      );
    case "afro":
      return <circle cx="50" cy="34" r="32" fill={def.hairColor} />;
    case "bald":
      return null;
    case "short":
    default:
      return <path d="M18 48 Q18 14 50 14 Q82 14 82 48 L80 54 Q76 28 50 24 Q24 28 20 54 Z" fill={def.hairColor} />;
  }
}

export default function AvatarIcon({ avatar, size = 64, className = "" }: AvatarIconProps) {
  const isAfro = avatar.hairStyle === "afro";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${avatar.name} avatar`}
    >
      <circle cx="50" cy="96" r="26" fill={avatar.outfitColor} />
      {isAfro && hairElement(avatar)}
      <circle cx="50" cy="52" r="30" fill={avatar.skinTone} />
      {!isAfro && hairElement(avatar)}
      <circle cx="40" cy="54" r="3.2" fill="#1f2937" />
      <circle cx="60" cy="54" r="3.2" fill="#1f2937" />
      <path d="M42 66 Q50 71 58 66" stroke="#1f2937" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}