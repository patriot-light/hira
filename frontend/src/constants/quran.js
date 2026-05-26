export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322,
  342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export const getJuzPageRange = (juz) => {
  const index = Number(juz) - 1;
  const start = JUZ_START_PAGES[index] || 1;
  const end = JUZ_START_PAGES[index + 1] ? JUZ_START_PAGES[index + 1] - 1 : 604;
  return { start, end };
};

export const getJuzPages = (juz) => {
  const { start, end } = getJuzPageRange(juz);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const getJuzPagesRange = (fromJuz, toJuz) => {
  const from = Number(fromJuz);
  const to = Number(toJuz);
  if (!from || !to || from > to) return [];
  const start = getJuzPageRange(from).start;
  const end = getJuzPageRange(to).end;
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const JUZ_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

export const SESSION_PAGE_RATINGS = [
  { value: "acceptable", labelAr: "مقبول", score: 70 },
  { value: "good", labelAr: "جيد", score: 80 },
  { value: "very_good", labelAr: "جيد جدا", score: 90 },
  { value: "excellent", labelAr: "ممتاز", score: 95 },
  { value: "outstanding", labelAr: "تفوق", score: 100 },
];

export const getPagesInRange = (fromPage, toPage) => {
  const from = Number(fromPage);
  const to = Number(toPage);
  if (!from || !to || from > to) return [];
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
};
