export const LOCALES = ['kk', 'ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Native names. They stay the same in every interface language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  kk: 'Қазақша',
  ru: 'Русский',
  en: 'English',
};

export interface PluralForms {
  one: string;
  few: string;
  many: string;
}

export interface Messages {
  app: {
    title: string;
    reset: string;
    footer: string;
    language: string;
  };
  views: { group: string; find: string; make: string };
  hero: {
    next: string;
    today: string;
    now: string;
    empty: string;
    showDate: string;
    noShared: string;
    passed: string;
  };
  calendar: {
    previous: string;
    next: string;
    month: string;
    year: string;
    caption: string;
    both: string;
    personA: string;
    personB: string;
    work: string;
    legendOff: string;
    legendBoth: string;
    legendA: string;
    legendB: string;
    legendWork: string;
    today: string;
    outside: string;
    suggest: string;
    suggestNote: string;
    freeName: string;
    workingName: string;
    bothFree: string;
    bothWorking: string;
  };
  weekdaysShort: [string, string, string, string, string, string, string];
  weekdaysLong: [string, string, string, string, string, string, string];
  months: [string, string, string, string, string, string, string, string, string, string, string, string];
  monthsInDate: [string, string, string, string, string, string, string, string, string, string, string, string];
  periods: {
    heading: string;
    passed: string;
    empty: string;
    past: string;
    now: string;
    upcoming: string;
  };
  schedules: {
    heading: string;
    intro: string;
    name: string;
    schedule: string;
    anchor: string;
    anchorHint: string;
    weekdayHint: string;
    day: string;
    add: string;
    remove: string;
    work: string;
    free: string;
    presets: { '2-2': string; '3-3': string; '4-4': string; weekdays: string; custom: string };
    anchorDay: string;
    anchorMonth: string;
    anchorYear: string;
    fallbackA: string;
    fallbackB: string;
    demoA: string;
    demoB: string;
  };
  bridge: {
    heading: string;
    intro: string;
    empty: string;
    extend: string;
    join: string;
    create: string;
    together: string;
    inspect: string;
    inspectLabel: string;
    title: string;
  };
  preview: {
    action: string;
    viewing: string;
    exit: string;
    title: string;
    notApplied: string;
    who: string;
    before: string;
    after: string;
    none: string;
    and: string;
    gained: string;
    cell: string;
    cellLabel: string;
    spanLabel: string;
    legend: string;
  };
  quantity: {
    day: PluralForms;
    sharedDay: PluralForms;
    period: PluralForms;
    together: PluralForms;
  };
}
