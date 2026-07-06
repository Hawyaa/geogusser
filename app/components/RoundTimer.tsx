"use client";
import { useEffect, useRef } from "react";

interface RoundTimerProps {
  duration: number;
  onTimeUp: () => void;
  paused?: boolean;
}

export default function RoundTimer({ duration, onTimeUp, paused = false }: RoundTimerProps) {
  const timeLeftRef = useRef(duration);
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useEffect(() => {
    timeLeftRef.current = duration;
    updateUI(duration, duration);
  }, [duration]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      updateUI(timeLeftRef.current, duration);
      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current!);
        setTimeout(() => onTimeUpRef.current(), 0);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, duration]);

  function updateUI(timeLeft: number, total: number) {
    const pct = Math.max(0, (timeLeft / total) * 100);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}s`;

    if (barRef.current) {
      barRef.current.style.width = `${pct}%`;
      barRef.current.className = `h-full rounded-full transition-all duration-1000 ease-linear ${
        pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-400" : "bg-red-500"
      }`;
    }
    if (textRef.current) {
      textRef.current.textContent = formatted;
      textRef.current.className = `text-sm font-bold tabular-nums ${
        pct > 50 ? "text-green-400" : pct > 25 ? "text-yellow-400" : "text-red-400"
      }`;
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-xs uppercase tracking-wide">Time Left</span>
        <span ref={textRef} className="text-sm font-bold tabular-nums text-green-400">{duration}s</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div ref={barRef} className="h-full rounded-full bg-green-500 transition-all duration-1000 ease-linear" style={{ width: "100%" }} />
      </div>
    </div>
  );
}
