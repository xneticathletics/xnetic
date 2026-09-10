function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "Ayın X'inden bugüne kadar" dönemini hesaplar. Bugünün günü henüz X'e
// gelmediyse (ör. başlangıç günü 5, bugün ayın 3'ü), bir önceki ayın X'inden
// başlar — kesintisiz, döngüsel bir "finansal dönem" (fatura dönemi gibi).
export function getFinancePeriodRange(startDay: number, today: Date = new Date()): { start: string; end: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  let startYear = y;
  let startMonth = m;
  if (d < startDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const clampedStartDay = Math.min(startDay, lastDayOfStartMonth);
  const start = new Date(startYear, startMonth, clampedStartDay);

  return { start: toISODate(start), end: toISODate(today) };
}
