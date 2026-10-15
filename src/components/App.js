export function renderApp(root, planning) {
  const main = document.createElement('main');
  main.className = 'app';

  const header = document.createElement('header');
  const label = document.createElement('p');
  label.className = 'eyebrow';
  label.textContent = 'Planejamento acadêmico';
  const title = document.createElement('h1');
  title.textContent = planning.name || 'Gerador de cronograma de disciplina';
  const description = document.createElement('p');
  description.textContent = 'Montagem manual assistida: você organiza as aulas e mantém o controle do planejamento.';
  header.append(label, title, description);

  const overview = document.createElement('section');
  overview.setAttribute('aria-label', 'Resumo do planejamento');
  overview.className = 'overview';
  const metrics = [
    ['Professores', planning.teachers.length],
    ['Disciplinas', planning.subjects.length],
    ['Turmas', planning.groups.length],
    ['Encontros agendados', planning.scheduledMeetings.length],
  ];
  for (const [name, count] of metrics) {
    const card = document.createElement('article');
    card.className = 'card';
    const heading = document.createElement('h2');
    heading.textContent = name;
    const value = document.createElement('p');
    value.className = 'metric';
    value.textContent = String(count);
    card.append(heading, value);
    overview.append(card);
  }

  const notice = document.createElement('section');
  notice.className = 'notice';
  const noticeTitle = document.createElement('h2');
  noticeTitle.textContent = 'Base inicial do projeto';
  const noticeText = document.createElement('p');
  noticeText.textContent = 'Cadastros, calendário, verificação de conflitos e salvamento ainda não estão implementados. Esta tela apresenta apenas o estado inicial em memória.';
  notice.append(noticeTitle, noticeText);
  main.append(header, overview, notice);
  root.replaceChildren(main);
}
