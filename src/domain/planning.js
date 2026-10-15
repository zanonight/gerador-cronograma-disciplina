/** Estado inicial em memória; sem persistência ou regras de agendamento nesta etapa. */
export function createPlanning() {
  return {
    name: '',
    term: '',
    startDate: null,
    endDate: null,
    teachers: [],
    subjects: [],
    groups: [],
    lessons: [],
    timeSlots: [],
    events: [],
    scheduledMeetings: [],
  };
}
