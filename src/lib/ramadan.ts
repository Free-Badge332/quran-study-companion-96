// Pure Ramadan rules: which fasting moment comes next, and the daily worship checklist.
export type FastEvent = { kind: "suhoor" | "iftar"; at: Date };

/**
 * Next relevant fasting moment: suhoor ends at today's Fajr, iftar at Maghrib;
 * after Maghrib the next is tomorrow's Fajr.
 */
export function nextFastEvent(now: Date, today: { fajr: Date; maghrib: Date }, tomorrowFajr: Date): FastEvent {
  if (now < today.fajr) return { kind: "suhoor", at: today.fajr };
  if (now < today.maghrib) return { kind: "iftar", at: today.maghrib };
  return { kind: "suhoor", at: tomorrowFajr };
}

export const CHECKLIST = ["fasted", "fivePrayers", "taraweeh", "quran", "morningAzkar", "eveningAzkar", "sadaqah"] as const;
export type ChecklistItem = (typeof CHECKLIST)[number];

export function toggleItem(list: ChecklistItem[], item: ChecklistItem): ChecklistItem[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export const checklistProgress = (list: ChecklistItem[]) =>
  list.filter((x) => (CHECKLIST as readonly string[]).includes(x)).length / CHECKLIST.length;
