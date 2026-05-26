export function halaqaLabel(halaqa, t) {
  if (!halaqa) return "-";
  const gender = halaqa.gender ? t(halaqa.gender) : "";
  return gender ? `${halaqa.name} - ${gender}` : halaqa.name;
}

export function studentHalaqaIds(student) {
  return student?.halaqa_ids || (student?.halaqa_id ? [student.halaqa_id] : []);
}
