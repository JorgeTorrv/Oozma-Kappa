/** A, B, C… Z, luego AA, AB… para que cada pin/tarjeta tenga su letra. */
export function markerBadge(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}
