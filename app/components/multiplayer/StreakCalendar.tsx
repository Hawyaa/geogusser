"use client";

interface StreakCalendarProps {
  currentStreak: number;
  daysPlayedThisMonth: string[];
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function StreakCalendar({ currentStreak, daysPlayedThisMonth }: StreakCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const playedSet = new Set(daysPlayedThisMonth.map((d) => d.slice(8, 10)));

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white/5 border border-violet-900/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔥</span>
          <span className="text-white font-bold text-sm">Daily streak</span>
        </div>
        <span className="text-violet-300 text-xs font-semibold">
          {currentStreak} day{currentStreak === 1 ? "" : "s"}
        </span>
      </div>

      <p className="text-gray-500 text-xs mb-3">
        {MONTH_NAMES[month]} {year}
      </p>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-center text-gray-600 text-[10px]">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dayStr = String(day).padStart(2, "0");
          const isToday = day === today;
          const wasPlayed = playedSet.has(dayStr);
          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs ${
                isToday
                  ? "border-2 border-green-400 text-white font-bold"
                  : wasPlayed
                  ? "bg-violet-700/50 text-white"
                  : "text-gray-600"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
