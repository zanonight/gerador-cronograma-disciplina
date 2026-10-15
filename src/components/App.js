function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, type = 'button') {
  const node = element('button', text);
  node.type = type;
  return node;
}

function field(form, labelText, name, value = '', type = 'text') {
  const label = element('label', labelText);
  const input = document.createElement('input');
  Object.assign(input, { name, type, value: value || '', required: true });
  if (type === 'text') input.maxLength = 160;
  label.append(element('br'), input);
  form.append(label, element('br'));
  return input;
}

function normalize(value) {
  return value.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}

function registrationPanel(planning, heading, singular, key, announce, updateCounters) {
  const card = element('section', undefined, 'card');
  const form = document.createElement('form');
  const input = field(form, `Nome — ${singular}`, key);
  const submit = button('Adicionar', 'submit');
  const cancel = button('Cancelar edição');
  cancel.hidden = true;
  form.append(submit, cancel);
  const list = element('ul');
  const empty = element('p', 'Nenhum registro cadastrado.');
  let editingId = null;
  const reset = () => {
    editingId = null;
    form.reset();
    input.setCustomValidity('');
    submit.textContent = 'Adicionar';
    cancel.hidden = true;
  };
  const refresh = () => {
    list.replaceChildren();
    for (const item of planning[key]) {
      const row = element('li');
      const edit = button('Editar');
      const remove = button('Excluir');
      edit.setAttribute('aria-label', `Editar ${singular}: ${item.name}`);
      remove.setAttribute('aria-label', `Excluir ${singular}: ${item.name}`);
      edit.addEventListener('click', () => {
        editingId = item.id;
        input.value = item.name;
        input.setCustomValidity('');
        submit.textContent = 'Salvar alteração';
        cancel.hidden = false;
        announce(`Editando ${singular}: ${item.name}.`);
        input.focus();
      });
      remove.addEventListener('click', () => {
        if (!window.confirm(`Excluir ${singular} "${item.name}"? Esta ação não pode ser desfeita.`)) return;
        const index = planning[key].findIndex((entry) => entry.id === item.id);
        if (index < 0) return;
        planning[key].splice(index, 1);
        if (editingId === item.id) reset();
        refresh();
        announce(`${item.name}: registro excluído do rascunho em memória.`);
        input.focus();
      });
      row.append(element('span', `${item.name} `), edit, document.createTextNode(' '), remove);
      list.append(row);
    }
    empty.hidden = planning[key].length > 0;
    list.hidden = planning[key].length === 0;
    updateCounters();
  };
  cancel.addEventListener('click', () => {
    reset();
    announce(`Edição de ${singular} cancelada. Nenhuma alteração aplicada.`);
    input.focus();
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    const duplicate = planning[key].some((item) => item.id !== editingId && normalize(item.name) === normalize(value));
    input.setCustomValidity(!value ? 'Informe um nome.' : duplicate ? 'Já existe um registro com esse nome nesta categoria.' : '');
    if (!form.reportValidity()) return;
    const editing = editingId !== null;
    if (editing) {
      const item = planning[key].find((entry) => entry.id === editingId);
      if (!item) {
        reset();
        announce('O registro não existe mais.');
        return;
      }
      item.name = value;
    } else {
      const usedIds = new Set(planning[key].map((item) => item.id));
      let sequence = planning[key].length + 1;
      while (usedIds.has(`${key}-${sequence}`)) sequence += 1;
      planning[key].push({ id: `${key}-${sequence}`, name: value });
    }
    reset();
    refresh();
    announce(`${value}: registro ${editing ? 'atualizado' : 'adicionado'} no rascunho em memória.`);
    input.focus();
  });
  refresh();
  card.append(element('h2', heading), form, empty, list);
  return card;
}

export function renderApp(root, planning) {
  const main = element('main', undefined, 'app');
  const header = element('header');
  const title = element('h1', planning.name || 'Gerador de cronograma de disciplina');
  header.append(element('p', 'Planejamento acadêmico', 'eyebrow'), title,
    element('p', 'Montagem manual assistida: você decide onde colocar cada aula.'));
  const notice = element('section', undefined, 'notice');
  notice.append(element('h2', 'Rascunho em memória'),
    element('p', 'Os dados serão perdidos ao recarregar ou fechar esta página. Salvamento, aulas, calendário, vínculos entre cadastros e verificação de conflitos ainda não estão implementados.'));
  const status = element('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const announce = (message) => { status.textContent = message; };
  const overview = element('section', undefined, 'overview');
  overview.setAttribute('aria-label', 'Resumo do planejamento');
  const counters = [];
  for (const [label, key] of [['Professores', 'teachers'], ['Disciplinas', 'subjects'], ['Turmas', 'groups'], ['Encontros agendados', 'scheduledMeetings']]) {
    const card = element('article', undefined, 'card');
    const count = element('p', String(planning[key].length), 'metric');
    counters.push([key, count]);
    card.append(element('h2', label), count);
    overview.append(card);
  }
  const updateCounters = () => {
    for (const [key, count] of counters) count.textContent = String(planning[key].length);
  };
  const config = element('section', undefined, 'card');
  config.append(element('h2', 'Configuração do planejamento'));
  const form = document.createElement('form');
  const name = field(form, 'Nome do planejamento', 'name', planning.name);
  const term = field(form, 'Ano/semestre', 'term', planning.term);
  const start = field(form, 'Data inicial', 'startDate', planning.startDate, 'date');
  const end = field(form, 'Data final', 'endDate', planning.endDate, 'date');
  form.append(button('Aplicar ao rascunho', 'submit'));
  form.addEventListener('input', () => {
    for (const input of [name, term, end]) input.setCustomValidity('');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Informe o nome do planejamento.');
    term.setCustomValidity(term.value.trim() ? '' : 'Informe o ano/semestre.');
    end.setCustomValidity(end.value < start.value ? 'A data final deve ser igual ou posterior à inicial.' : '');
    if (!form.reportValidity()) return;
    Object.assign(planning, { name: name.value.trim(), term: term.value.trim(), startDate: start.value, endDate: end.value });
    title.textContent = planning.name;
    announce('Configuração aplicada ao rascunho em memória. Não há salvamento permanente.');
  });
  config.append(form);
  const registrations = element('section', undefined, 'overview');
  registrations.setAttribute('aria-label', 'Cadastros básicos');
  for (const [heading, singular, key] of [['Professores', 'professor', 'teachers'], ['Disciplinas', 'disciplina', 'subjects'], ['Turmas', 'turma', 'groups']]) {
    registrations.append(registrationPanel(planning, heading, singular, key, announce, updateCounters));
  }
  main.append(header, notice, overview, status, config, registrations);
  root.replaceChildren(main);
}
