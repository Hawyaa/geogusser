// Lightweight fixed starfield — deterministic positions so it doesn't
// reshuffle on every re-render (no Math.random() in render, which would
// also cause a hydration mismatch between server and client).
const STAR_POSITIONS = Array.from({ length: 60 }, (_, i) => {
  const seed = i * 137.5;
  return {
    x: (seed * 1.618) % 100,
    y: (seed * 2.718) % 100,
    r: 0.5 + ((i * 7) % 10) / 10,
    o: 0.3 + ((i * 13) % 7) / 10,
  };
});

export default function Starfield() {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      {STAR_POSITIONS.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />
      ))}
    </svg>
  );
}
