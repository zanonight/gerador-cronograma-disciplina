function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function field(form, labelText, name, value = '', type = 'text') {
  const label = element('label', labelText);
  const input = document.createElement('input');
  input.name = name;
  input.type = type;
  input.value = value || '';
  input.required = true;
  if (type === 'text') input.maxLength = 160;
  label.append(element('br'), input);
  form.append(label, element('br'));
  return input;
}

function normalize(value) {
  return value.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}

export function renderApp(root, planning) {
  const main = element('main', undefined, 'app');
  const header = element('header');
  const title = element('h1', planning.name || 'Gerador de cronograma de disciplina');
  header.append(
    element('p', 'Planejamento acadêmico', 'eyebrow'),
    title,
    element('p', 'Montagem manual assistida: você decide onde colocar cada aula.'),
  );

  const notice = element('section', undefined, 'notice');
  notice.append(
    element('h2', 'Rascunho em memória'),
    element('p', 'Os dados serão perdidos ao recarregar ou fechar esta página. Salvamento, aulas, calendário e verificação de conflitos ainda não estão implementados.'),
  );

  const status = element('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const overview = element('section', undefined, 'overview');
  overview.setAttribute('aria-label', 'Resumo do planejamento');
  const counters = [];
  for (const [label, key] of [
    ['Professores', 'teachers'],
    ['Disciplinas', 'subjects'],
    ['Turmas', 'groups'],
    ['Encontros agendados', 'scheduledMeetings'],
  ]) {
    const card = element('article', undefined, 'card');
    const count = element('p', String(planning[key].length), 'metric');
    counters.push([key, count]);
    card.append(element('h2', label), count);
    overview.append(card);
  }

  const config = element('section', undefined, 'card');
  config.append(element('h2', 'Configuração do planejamento'));
  const configForm = document.createElement('form');
  const name = field(configForm, 'Nome do planejamento', 'name', planning.name);
  const term = field(configForm, 'Ano/semestre', 'term', planning.term);
  const start = field(configForm, 'Data inicial', 'startDate', planning.startDate, 'date');
  const end = field(configForm, 'Data final', 'endDate', planning.endDate, 'date');
  const apply = element('button', 'Aplicar ao rascunho');
  apply.type = 'submit';
  configForm.append(apply);
  configForm.addEventListener('input', () => {
    name.setCustomValidity('');
    term.setCustomValidity('');
    end.setCustomValidity('');
  });
  configForm.addEventListener('submit', (event) => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Informe o nome do planejamento.');
    term.setCustomValidity(term.value.trim() ? '' : 'Informe o ano/semestre.');
    end.setCustomValidity(end.value < start.value ? 'A data final deve ser igual ou posterior à inicial.' : '');
    if (!configForm.reportValidity()) return;
    Object.assign(planning, {
      name: name.value.trim(),
      term: term.value.trim(),
      startDate: start.value,
      endDate: end.value,
    });
    title.textContent = planning.name;
    status.textContent = 'Configuração aplicada ao rascunho em memória. Não há salvamento permanente.';
  });
  config.append(configForm);

  const registrations = element('section', undefined, 'overview');
  registrations.setAttribute('aria-label', 'Cadastros básicos');
  for (const [heading, singular, key] of [
    ['Professores', 'professor', 'teachers'],
    ['Disciplinas', 'disciplina', 'subjects'],
    ['Turmas', 'turma', 'groups'],
  ]) {
    const card = element('section', undefined, 'card');
    card.append(element('h2', heading));
    const form = document.createElement('form');
    const input = field(form, `Nome — ${singular}`, key);
    const add = element('button', 'Adicionar');
    add.type = 'submit';
    form.append(add);
    const list = element('ul');
    const empty = element('p', 'Nenhum registro cadastrado.');
    const refresh = () => {
      list.replaceChildren(...planning[key].map((item) => element('li', item.name)));
      empty.hidden = planning[key].length > 0;
      list.hidden = planning[key].length === 0;
      for (const [counterKey, count] of counters) count.textContent = String(planning[counterKey].length);
    };
    input.addEventListener('input', () => input.setCustomValidity(''));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      const duplicate = planning[key].some((item) => normalize(item.name) === normalize(value));
      input.setCustomValidity(!value ? 'Informe um nome.' : duplicate ? 'Já existe um registro com esse nome nesta categoria.' : '');
      if (!form.reportValidity()) return;
      const usedIds = new Set(planning[key].map((item) => item.id));
      let sequence = planning[key].length + 1;
      while (usedIds.has(`${key}-${sequence}`)) sequence += 1;
      planning[key].push({ id: `${key}-${sequence}`, name: value });
      form.reset();
      refresh();
      status.textContent = `${value}: registro adicionado ao rascunho em memória.`;
      input.focus();
    });
    refresh();
    card.append(form, empty, list);
    registrations.append(card);
  }

  main.append(header, notice, overview, status, config, registrations);
  root.replaceChildren(main);
}
