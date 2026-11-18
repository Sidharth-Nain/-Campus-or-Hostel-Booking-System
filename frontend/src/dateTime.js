export function toIsoDateTime(localValue) {
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function minimumLocalDateTime() {
  const date = new Date(Date.now() + 5 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function formatBookingDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatBookingRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const startText = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(start);
  const endText = new Intl.DateTimeFormat(undefined, sameDay
    ? { timeStyle: "short" }
    : { dateStyle: "medium", timeStyle: "short" }).format(end);
  return `${startText} – ${endText}`;
}
