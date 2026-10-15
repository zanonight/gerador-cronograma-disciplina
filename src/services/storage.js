export const STORAGE_KEY = 'cronograma-disciplina:planning';
const VERSION = 1;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

export function validatePlanning(data) {
  if (!isObject(data) || typeof data.name !== 'string' || typeof data.term !== 'string') return false;
  const validDate = (value) => {
    if (value === null) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(data.startDate) || !validDate(data.endDate)) return false;
  if (data.startDate && data.endDate && data.endDate < data.startDate) return false;
  const keys = ['teachers', 'subjects', 'groups', 'lessons', 'timeSlots', 'events', 'scheduledMeetings'];
  if (!keys.every((key) => Array.isArray(data[key]) && data[key].every(isObject))) return false;
  for (const key of ['teachers', 'subjects', 'groups', 'lessons']) {
    if (!data[key].every((item) => nonEmpty(item.id))) return false;
    if (new Set(data[key].map((item) => item.id)).size !== data[key].length) return false;
  }
  if (!['teachers', 'subjects', 'groups'].every((key) => data[key].every((item) => nonEmpty(item.name)))) return false;
  const ids = (key) => new Set(data[key].map((item) => item.id));
  const subjects = ids('subjects'), teachers = ids('teachers'), groups = ids('groups');
  const validLinks = (values, allowed) => Array.isArray(values) && values.length > 0 &&
    new Set(values).size === values.length && values.every((id) => allowed.has(id));
  return data.lessons.every((lesson) => nonEmpty(lesson.title) && subjects.has(lesson.subjectId) &&
    validLinks(lesson.teacherIds, teachers) && validLinks(lesson.groupIds, groups));
}

export function loadPlanning() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const document = JSON.parse(raw);
  if (!isObject(document) || document.version !== VERSION || !validatePlanning(document.planning)) {
    throw new Error('Formato ou versão do planejamento local inválido.');
  }
  return document.planning;
}

export function savePlanning(planning) {
  if (!validatePlanning(planning)) throw new Error('Planejamento inválido para salvamento.');
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, planning }));
}
