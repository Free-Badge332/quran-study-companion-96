import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SLEEP_PRESETS, formatRemaining, remainingMs, sleepTimer, useSleepTimer } from "@/lib/sleep-timer";
import { useEffect, useState } from "react";

export function SleepTimerControl({ chapter }: { chapter: number }) {
  const s = useSleepTimer();
  const [, tick] = useState(0);
  useEffect(() => {
    if (s.mode !== "duration" || s.paused) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [s]);
  const label =
    s.mode === "duration" ? formatRemaining(remainingMs(s, Date.now())) : s.mode === "surah" ? "End of surah" : "Sleep timer";
  const active = s.mode !== "off";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={active ? "default" : "outline"} type="button" aria-label="Sleep timer"
          className="flex min-h-11 min-w-0 items-center gap-1 whitespace-normal px-2 py-2 text-sm">
          <Moon size={14} /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="grid grid-cols-3 gap-2">
          {SLEEP_PRESETS.map((m) => (
            <Button key={m} size="sm" variant="outline" onClick={() => sleepTimer.start(m)}>{m} min</Button>
          ))}
        </div>
        <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => sleepTimer.endOfSurah(chapter)}>End of surah</Button>
        {s.mode === "duration" && (
          <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => (s.paused ? sleepTimer.resume() : sleepTimer.pause())}>
            {s.paused ? "Resume" : "Pause"}
          </Button>
        )}
        {active && <Button className="mt-2 w-full" size="sm" variant="ghost" onClick={() => sleepTimer.cancel()}>Turn off</Button>}
      </PopoverContent>
    </Popover>
  );
}
