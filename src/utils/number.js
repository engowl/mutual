export function formatNumberToKMB(number) {
  if (number >= 1_000_000_000) {
    return (
      (number / 1_000_000_000).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      }) + "B"
    );
  } else if (number >= 1_000_000) {
    return (
      (number / 1_000_000).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      }) + "M"
    );
  } else if (number >= 1_000) {
    return (
      (number / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 }) +
      "K"
    );
  } else {
    return number.toLocaleString();
  }
}
