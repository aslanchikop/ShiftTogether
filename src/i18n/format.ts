import { isoWeekday, parseIsoDate } from '../calendar';
import type { BridgeExplanation, BridgeRecommendation } from '../schedules/bridge';
import { BRIDGE_SEARCH_DAYS } from '../schedules/bridge';
import type { NextSharedPeriod, PeriodTiming, SharedMonthSummary } from '../schedules/summary';
import { FORWARD_SEARCH_DAYS } from '../schedules/summary';
import { catalogs } from './catalog';
import { quantity } from './plural';
import type { Locale, Messages } from './types';

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function messagesFor(locale: Locale): Messages {
  return catalogs[locale];
}

export function monthTitle(year: number, month: number, locale: Locale): string {
  const name = catalogs[locale].months[month - 1] ?? '';
  return locale === 'kk' ? `${year} ${name}` : `${name} ${year}`;
}

function monthInDate(month: number, locale: Locale): string {
  return catalogs[locale].monthsInDate[month - 1] ?? '';
}

function weekdayLong(iso: string, locale: Locale): string {
  return catalogs[locale].weekdaysLong[isoWeekday(iso) - 1] ?? '';
}

/** A civil date in words. Parts come from the calendar engine, not from a timestamp. */
export function formatCivilDate(iso: string, locale: Locale): string {
  const { year, month, day } = parseIsoDate(iso);
  const weekday = weekdayLong(iso, locale);
  const monthName = monthInDate(month, locale);
  if (locale === 'kk') return `${weekday}, ${day} ${monthName} ${year}`;
  if (locale === 'ru') return `${weekday}, ${day} ${monthName} ${year}`;
  return `${weekday} ${day} ${monthName} ${year}`;
}

export function formatRange(start: string, end: string, today: string, locale: Locale): string {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  const todayYear = parseIsoDate(today).year;
  const sameMonth = a.year === b.year && a.month === b.month;
  const needsYear = a.year !== todayYear || b.year !== todayYear;
  const left = monthInDate(a.month, locale);
  const right = monthInDate(b.month, locale);

  if (start === end) {
    return needsYear ? `${a.day} ${left} ${a.year}` : `${a.day} ${left}`;
  }
  if (sameMonth) {
    return needsYear ? `${a.day}–${b.day} ${left} ${a.year}` : `${a.day}–${b.day} ${left}`;
  }
  if (a.year === b.year && !needsYear) return `${a.day} ${left} – ${b.day} ${right}`;
  return `${a.day} ${left} ${a.year} – ${b.day} ${right} ${b.year}`;
}

export function formatWeekdaySpan(start: string, end: string, locale: Locale): string {
  const from = weekdayLong(start, locale);
  const to = weekdayLong(end, locale);
  return start === end ? from : `${from}–${to}`;
}

export function formatPeriodSpan(start: string, end: string, days: number, locale: Locale): string {
  const length = quantity(locale, days, catalogs[locale].quantity.day);
  return `${length} · ${formatWeekdaySpan(start, end, locale)}`;
}

export function formatMonthCount(summary: SharedMonthSummary, monthLabel: string, locale: Locale): string {
  const copy = catalogs[locale];
  if (summary.sharedDayCount === 0) return fill(copy.hero.noShared, { month: monthLabel });
  const days = quantity(locale, summary.sharedDayCount, copy.quantity.sharedDay);
  const periods = quantity(locale, summary.periodCount, copy.quantity.period);
  const passed = summary.monthRelation === 'past' ? copy.hero.passed : '';
  return `${days} · ${periods}${passed}`;
}

export function heroKicker(next: NextSharedPeriod, today: string, locale: Locale): string {
  const copy = catalogs[locale].hero;
  if (next.timing === 'current' && next.interval.start === today && next.interval.days === 1) return copy.today;
  if (next.timing === 'current') return copy.now;
  return copy.next;
}

export function horizonEmpty(locale: Locale): string {
  const copy = catalogs[locale];
  return fill(copy.hero.empty, {
    count: FORWARD_SEARCH_DAYS,
    days: quantity(locale, FORWARD_SEARCH_DAYS, copy.quantity.day).replace(`${FORWARD_SEARCH_DAYS} `, ''),
  });
}

export function periodStateLabel(timing: PeriodTiming, locale: Locale): string {
  const copy = catalogs[locale].periods;
  if (timing === 'past') return copy.past;
  if (timing === 'current') return copy.now;
  return copy.upcoming;
}

export interface BridgeCardCopy {
  effect: string;
  kind: 'extend' | 'join' | 'create';
  title: string;
  range: string;
  total: string;
  gained: string;
}

export function bridgeKind(explanation: BridgeExplanation): BridgeCardCopy['kind'] {
  if (explanation === 'joined-two-periods') return 'join';
  if (explanation === 'created-period') return 'create';
  return 'extend';
}

export function bridgeCardCopy(
  item: BridgeRecommendation,
  name: string,
  today: string,
  locale: Locale,
): BridgeCardCopy {
  const copy = catalogs[locale];
  const kind = bridgeKind(item.explanation);
  const effect = kind === 'join' ? copy.bridge.join : kind === 'create' ? copy.bridge.create : copy.bridge.extend;
  return {
    effect,
    kind,
    title: fill(copy.bridge.title, { name, date: formatCivilDate(item.date, locale) }),
    range: formatRange(item.resulting.start, item.resulting.end, today, locale),
    total: quantity(locale, item.resulting.days, copy.quantity.together),
    gained: `+${quantity(locale, item.additionalSharedDays, copy.quantity.day)}`,
  };
}

export function bridgeIntro(locale: Locale): string {
  const copy = catalogs[locale];
  return fill(copy.bridge.intro, {
    count: BRIDGE_SEARCH_DAYS,
    days: quantity(locale, BRIDGE_SEARCH_DAYS, copy.quantity.day).replace(`${BRIDGE_SEARCH_DAYS} `, ''),
  });
}

export function bridgeEmpty(locale: Locale): string {
  const copy = catalogs[locale];
  return fill(copy.bridge.empty, {
    count: BRIDGE_SEARCH_DAYS,
    days: quantity(locale, BRIDGE_SEARCH_DAYS, copy.quantity.day).replace(`${BRIDGE_SEARCH_DAYS} `, ''),
  });
}
