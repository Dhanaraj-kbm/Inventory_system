export function formatShortDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
}

export function formatDisplayDate(dateValue) {
  return dateValue.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function getInitial(value) {
  return value ? value.charAt(0).toUpperCase() : "P";
}
