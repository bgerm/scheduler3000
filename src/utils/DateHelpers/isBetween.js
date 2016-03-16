export default function isBetween (src, from, to, units, inclusivity) {
  if (inclusivity === '(]') {
    return src.isAfter(from, units) && src.isSameOrBefore(to, units);
  } else if (inclusivity === '[)') {
    return src.isSameOrAfter(from, units) && src.isBefore(to, units);
  } else if (inclusivity === '[]') {
    return !(src.isBefore(from, units) || src.isAfter(to, units));
  }

  return src.isAfter(from, units) && src.isBefore(to, units);
}
