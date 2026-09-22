# ShiftTogether

ShiftTogether helps two people with different work schedules find days when both are free. A 2-on/2-off rotation can be compared with a Monday–Friday week, or with any other repeating cycle.

The app is free software. It runs entirely in the browser: there is no account, server, database, or API key. Calendar calculations stay on the device.

## Run locally

```bash
npm install
npm test
npm run dev
```

The dev server prints a local address. Open that address in a browser.

To build the static app:

```bash
npm run typecheck
npm run build
npm run preview
```

The production files are written to `dist/`. Because the asset paths are relative, that folder can be hosted on GitHub Pages or opened from a static file server.

## Calendar model

All schedule math uses ISO civil dates (`YYYY-MM-DD`). A date is a Gregorian year, month, and day. The engine does not convert those days through UTC timestamps, so a time zone cannot move a shift onto the previous or next calendar date.

There are two schedule kinds.

**Cycle.** An ordered list of working and free days, plus an anchor date. The anchor is day 1 of the pattern (index 0). The next civil date uses the next entry, wrapping at the end. Dates before the anchor continue backward through the same pattern. A 2/2 schedule anchored on 1 January 2024 is work, work, free, free, then repeats. 31 December 2023, the day before that anchor, is free, because that is the last day of the previous cycle.

**Days of the week.** Each ISO weekday is either work or free. Monday is 1 and Sunday is 7. The usual Monday–Friday schedule works those five days and is free on Saturday and Sunday. It has no anchor. The same control can represent a Sunday–Thursday week.

A date is shared free time when both people are free. Consecutive shared dates are one period, even when the run crosses a month boundary or 31 December. If you are looking at January and a shared run started on 31 December, the list shows the whole run.

Leap days are ordinary civil days. In 2024, 29 February exists and the cycle advances across it. In 1900, which is not a leap year, 28 February is followed by 1 March. The weekday of a date comes from the civil serial, with 1 January 1970 fixed as Thursday.

The only use of the system clock is choosing "today" for the first month and the demo anchor. That reading uses the local calendar year, month, and day.

## Project layout

```text
src/calendar/     civil dates, schedule status, shared-free intervals
src/schedules/    presets, demo pair, saved-state parsing
src/ui/           React screens
src/styles.css    visual rules
tests/            engine and state tests
```

React renders the month. It does not decide whether a day is free. Change schedule behaviour in `src/calendar/` and cover it in `tests/`.

The current pair of schedules is stored in `localStorage` under `shifttogether.v1`. Reset example restores the 2/2 and Monday–Friday demo. The month controls cover 1900 through 2200. Anchor dates can sit outside that window; the cycle still lines up.

## Not in this version

- Public holidays, one-off shift swaps, or more than two people
- Accounts, sync, or sharing
- Calendar export
- A deployment workflow

## License

[MIT](LICENSE)
