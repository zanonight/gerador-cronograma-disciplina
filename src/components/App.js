function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, action) {
  const node = el('button', text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function field(form, text, name, type = 'text', value = '') {
  const label = el('label', text);
  const input = el(type === 'select' ? 'select' : 'input');
  input.name = name;
  input.required = true;
  if (type !== 'select') {
    input.type = type;
    input.value = value || '';
    if (type === 'text') input.maxLength = 160;
  }
  label.append(el('br'), input);
  form.append(label, el('br'));
  input.addEventListener('input', () => input.setCustomValidity(''));
  input.addEventListener('change', () => input.setCustomValidity(''));
  return input;
}

const normalize = (text) => text.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
const selectedIds = (select) => Array.from(select.selectedOptions, (option) => option.value).filter(Boolean);

export function renderApp(root, planning) {
  const main = el('main', undefined, 'app');
  const title = el('h1', planning.name || 'Gerador de cronograma de disciplina');
  const header = el('header');
  header.append(el('p', 'Planejamento acadêmico', 'eyebrow'), title,
    el('p', 'Montagem manual assistida: você decide onde colocar cada aula.'));
  const notice = el('section', undefined, 'notice');
  notice.append(el('h2', 'Rascunho em memória'), el('p',
    'Os dados serão perdidos ao recarregar ou fechar esta página. Aulas são conteúdos ainda sem data e horário. Salvamento, calendário e verificação de conflitos de horário não estão implementados.'));
  const status = el('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const announce = (text) => { status.textContent = text; };
  const overview = el('section', undefined, 'overview');
  overview.setAttribute('aria-label', 'Resumo do planejamento');
  const counters = [];
  for (const [label, key] of [['Professores', 'teachers'], ['Disciplinas', 'subjects'], ['Turmas', 'groups'], ['Aulas cadastradas', 'lessons'], ['Encontros agendados', 'scheduledMeetings']]) {
    const card = el('article', undefined, 'card');
    const value = el('p', String(planning[key].length), 'metric');
    counters.push([key, value]);
    card.append(el('h2', label), value);
    overview.append(card);
  }

  const config = el('section', undefined, 'card');
  config.append(el('h2', 'Configuração do planejamento'));
  const configForm = el('form');
  const name = field(configForm, 'Nome do planejamento', 'name', 'text', planning.name);
  const term = field(configForm, 'Ano/semestre', 'term', 'text', planning.term);
  const start = field(configForm, 'Data inicial', 'startDate', 'date', planning.startDate);
  const end = field(configForm, 'Data final', 'endDate', 'date', planning.endDate);
  const apply = el('button', 'Aplicar ao rascunho');
  apply.type = 'submit';
  configForm.append(apply);
  configForm.addEventListener('input', () => {
    for (const input of [name, term, end]) input.setCustomValidity('');
  });
  configForm.addEventListener('submit', (event) => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Informe o nome do planejamento.');
    term.setCustomValidity(term.value.trim() ? '' : 'Informe o ano/semestre.');
    end.setCustomValidity(end.value < start.value ? 'A data final deve ser igual ou posterior à inicial.' : '');
    if (!configForm.reportValidity()) return;
    Object.assign(planning, { name: name.value.trim(), term: term.value.trim(), startDate: start.value, endDate: end.value });
    title.textContent = planning.name;
    announce('Configuração aplicada ao rascunho em memória. Não há salvamento permanente.');
  });
  config.append(configForm);

  const registrations = el('section', undefined, 'overview');
  registrations.setAttribute('aria-label', 'Cadastros e aulas');
  const panels = [];
  const displayName = (key, id) => planning[key].find((item) => item.id === id)?.name || 'Registro não encontrado';
  const refreshAll = () => {
    for (const [key, value] of counters) value.textContent = String(planning[key].length);
    for (const panel of panels) panel.refresh();
  };
  const linkedLessons = (key, id) => planning.lessons.filter((lesson) =>
    key === 'subjects' ? lesson.subjectId === id :
      key === 'teachers' ? lesson.teacherIds.includes(id) :
        key === 'groups' ? lesson.groupIds.includes(id) : false);

  for (const [heading, key] of [['Professores', 'teachers'], ['Disciplinas', 'subjects'], ['Turmas', 'groups'], ['Aulas', 'lessons']]) {
    const isLesson = key === 'lessons';
    const card = el('section', undefined, 'card');
    const form = el('form');
    const input = field(form, isLesson ? 'Título da aula' : 'Nome', `${key}-name`);
    let subject, teachers, groups;
    if (isLesson) {
      subject = field(form, 'Disciplina', 'subjectId', 'select');
      teachers = field(form, 'Professores responsáveis', 'teacherIds', 'select');
      groups = field(form, 'Turmas destinatárias', 'groupIds', 'select');
      for (const select of [teachers, groups]) { select.multiple = true; select.size = 4; }
      form.append(el('p', 'Selecione pelo menos um professor e uma turma. Para selecionar vários itens no computador, use Ctrl ou Command ao clicar.'));
    }
    let editingId = null;
    const submit = el('button', 'Adicionar');
    submit.type = 'submit';
    const reset = () => {
      editingId = null;
      form.reset();
      for (const control of form.elements) {
        if (typeof control.setCustomValidity === 'function') control.setCustomValidity('');
      }
      if (isLesson) {
        subject.value = '';
        for (const select of [teachers, groups]) {
          for (const option of select.options) option.selected = false;
        }
      }
      submit.textContent = 'Adicionar';
      cancel.hidden = true;
    };
    const cancel = button('Cancelar edição', () => {
      reset();
      announce('Edição cancelada. Nenhuma alteração aplicada.');
      input.focus();
    });
    cancel.hidden = true;
    form.append(submit, cancel);
    const empty = el('p', 'Nenhum registro cadastrado.');
    const list = el('ul');
    const fillOptions = (select, source, ids, placeholder = false) => {
      select.replaceChildren();
      if (placeholder) {
        const option = el('option', 'Selecione uma disciplina');
        option.value = '';
        select.append(option);
      }
      for (const item of source) {
        const option = el('option', item.name);
        option.value = item.id;
        option.selected = ids.includes(item.id);
        select.append(option);
      }
      if (placeholder && !source.some((item) => ids.includes(item.id))) select.value = '';
    };
    const refresh = () => {
      if (isLesson) {
        fillOptions(subject, planning.subjects, [subject.value], true);
        fillOptions(teachers, planning.teachers, selectedIds(teachers));
        fillOptions(groups, planning.groups, selectedIds(groups));
        submit.disabled = !planning.subjects.length || !planning.teachers.length || !planning.groups.length;
      }
      list.replaceChildren();
      for (const item of planning[key]) {
        const row = el('li');
        const description = isLesson
          ? `${item.title} — ${displayName('subjects', item.subjectId)} | Professores: ${item.teacherIds.map((id) => displayName('teachers', id)).join(', ')} | Turmas: ${item.groupIds.map((id) => displayName('groups', id)).join(', ')}`
          : item.name;
        const edit = button('Editar', () => {
          editingId = item.id;
          input.value = isLesson ? item.title : item.name;
          for (const control of form.elements) {
            if (typeof control.setCustomValidity === 'function') control.setCustomValidity('');
          }
          if (isLesson) {
            subject.value = item.subjectId;
            for (const [select, ids] of [[teachers, item.teacherIds], [groups, item.groupIds]]) {
              for (const option of select.options) option.selected = ids.includes(option.value);
            }
          }
          submit.textContent = 'Salvar alteração';
          cancel.hidden = false;
          announce(`Editando: ${isLesson ? item.title : item.name}.`);
          input.focus();
        });
        const remove = button('Excluir', () => {
          const linked = linkedLessons(key, item.id);
          if (linked.length) {
            announce(`Exclusão bloqueada. Ajuste primeiro os vínculos nas aulas: ${linked.map((lesson) => lesson.title).join('; ')}.`);
            return;
          }
          if (isLesson && planning.scheduledMeetings.some((meeting) => meeting.lessonId === item.id)) {
            announce('Exclusão bloqueada: a aula possui encontros agendados.');
            return;
          }
          const itemName = isLesson ? item.title : item.name;
          if (!window.confirm(`Excluir "${itemName}" de ${heading}? Esta ação não pode ser desfeita.`)) return;
          const index = planning[key].findIndex((entry) => entry.id === item.id);
          if (index < 0) return;
          planning[key].splice(index, 1);
          if (editingId === item.id) reset();
          refreshAll();
          announce(`${itemName}: registro excluído do rascunho em memória.`);
          input.focus();
        });
        edit.setAttribute('aria-label', `Editar: ${description}`);
        remove.setAttribute('aria-label', `Excluir: ${description}`);
        row.append(el('span', `${description} `), edit, document.createTextNode(' '), remove);
        list.append(row);
      }
      empty.hidden = planning[key].length > 0;
      list.hidden = planning[key].length === 0;
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      const duplicate = planning[key].some((item) => item.id !== editingId &&
        normalize(isLesson ? item.title : item.name) === normalize(value) && (!isLesson || item.subjectId === subject.value));
      input.setCustomValidity(!value ? 'Informe um nome ou título.' : duplicate ? 'Já existe um registro com esse nome nesta categoria ou disciplina.' : '');
      let data = { name: value };
      if (isLesson) {
        data = { title: value, subjectId: subject.value, teacherIds: selectedIds(teachers), groupIds: selectedIds(groups) };
        subject.setCustomValidity(planning.subjects.some((item) => item.id === data.subjectId) ? '' : 'Selecione uma disciplina cadastrada.');
        for (const [select, ids, source] of [[teachers, data.teacherIds, planning.teachers], [groups, data.groupIds, planning.groups]]) {
          select.setCustomValidity(ids.length && ids.every((id) => source.some((item) => item.id === id)) ? '' : 'Selecione pelo menos um registro válido.');
        }
      }
      if (!form.reportValidity()) return;
      const editing = editingId !== null;
      if (editing) {
        const item = planning[key].find((entry) => entry.id === editingId);
        if (!item) { reset(); announce('O registro não existe mais.'); return; }
        Object.assign(item, data);
      } else {
        const usedIds = new Set(planning[key].map((item) => item.id));
        let sequence = planning[key].length + 1;
        while (usedIds.has(`${key}-${sequence}`)) sequence += 1;
        planning[key].push({ id: `${key}-${sequence}`, ...data });
      }
      reset();
      refreshAll();
      announce(`${value}: registro ${editing ? 'atualizado' : 'adicionado'} no rascunho em memória.`);
      input.focus();
    });
    card.append(el('h2', heading));
    if (isLesson) card.append(el('p', 'Cadastre primeiro uma disciplina, um professor e uma turma. Os vínculos são mantidos por identificador.'));
    card.append(form, empty, list);
    registrations.append(card);
    panels.push({ refresh });
  }
  refreshAll();
  main.append(header, notice, overview, status, config, registrations);
  root.replaceChildren(main);
}
