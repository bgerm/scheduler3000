export default function isRangeOverlapping(s1, e1, s2, e2) {
  return s1.valueOf() <= e2.valueOf() && e1.valueOf() >= s2.valueOf();
};
