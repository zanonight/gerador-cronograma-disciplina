import { createPlanning } from './domain/planning.js';
import { renderApp } from './components/App.js';
import { STORAGE_KEY, loadPlanning, savePlanning } from './services/storage.js';

const sessions = new WeakMap();
const signature = (form) => JSON.stringify(Array.from(new FormData(form).entries()));

function readStable() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const planning = loadPlanning();
  if (raw !== window.localStorage.getItem(STORAGE_KEY)) {
    throw new Error('O planejamento mudou durante a leitura.');
  }
  return { raw, planning };
}

export function bootstrap(root = document.getElementById('app')) {
  if (!root) throw new Error('Elemento #app não encontrado.');
  sessions.get(root)?.abort();
  const controller = new AbortController();
  sessions.set(root, controller);
  const options = { signal: controller.signal };
  let planning = createPlanning();
  let baseline = null;
  let canSave = true;
  let restored = false;
  try {
    const stored = readStable();
    baseline = stored.raw;
    if (stored.planning) { planning = stored.planning; restored = true; }
  } catch (error) {
    canSave = false;
    console.error('Falha ao restaurar o planejamento local.', error);
  }
  renderApp(root, planning);
  const notice = root.querySelector('.notice');
  const noticeTitle = notice.querySelector('h2');
  const noticeText = notice.querySelector('p');
  const status = root.querySelector('[role="status"]');
  const limitations = ' Um planejamento compartilhado entre abas deste navegador e endereço, sem sincronização entre dispositivos. Limpar os dados do site pode apagá-lo. Não há mesclagem automática nem garantia transacional para gravações simultâneas. Calendário e conflitos de horário ainda não estão implementados.';
  const updateNotice = (title, message) => {
    noticeTitle.textContent = title;
    noticeText.textContent = message + limitations;
  };
  let lastSnapshot = JSON.stringify(planning);
  let savedLocally = restored;
  let externalPending = false;
  const forms = new Map(Array.from(root.querySelectorAll('form'), (form) => [form, signature(form)]));
  const hasDrafts = () => Array.from(forms).some(([form, initial]) => signature(form) !== initial);
  const hasUnsavedChanges = () => JSON.stringify(planning) !== lastSnapshot;
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Carregar versão compartilhada';
  reload.hidden = true;
  notice.append(reload);
  const markConflict = () => {
    externalPending = true;
    reload.hidden = false;
    updateNotice('Outra aba alterou o planejamento', 'Seu rascunho foi mantido nesta aba. O salvamento está bloqueado para evitar sobrescrever a versão compartilhada. Carregue a versão compartilhada quando estiver pronto; isso descartará o rascunho desta aba.');
    status.textContent = 'Atualização externa pendente. Rascunho preservado; salvamento bloqueado.';
  };
  reload.addEventListener('click', (event) => {
    event.stopPropagation();
    try {
      readStable();
      if ((hasDrafts() || hasUnsavedChanges()) && !window.confirm('Carregar a versão compartilhada? Os formulários em edição e as alterações não salvas desta aba serão descartados.')) return;
      bootstrap(root);
      root.querySelector('[role="status"]').textContent = 'Versão compartilhada carregada.';
    } catch (error) {
      status.textContent = 'Não foi possível validar a versão compartilhada. Seu rascunho foi mantido.';
      console.error('Falha ao carregar atualização externa.', error);
    }
  }, options);

  if (canSave) {
    updateNotice('Salvamento local e sincronização entre abas', restored
      ? 'Planejamento restaurado. Alterações confirmadas serão salvas e compartilhadas com outras abas.'
      : 'Alterações confirmadas serão salvas e compartilhadas com outras abas. Formulários não confirmados não são salvos.');
  } else {
    reload.hidden = false;
    updateNotice('Falha na leitura: salvamento desativado', 'Não foi possível ler ou validar os dados locais. O conteúdo existente não será sobrescrito nesta sessão. Este rascunho é temporário. Você pode tentar carregar novamente a versão compartilhada.');
  }

  const persist = (event) => {
    if (!canSave) {
      status.textContent = 'Salvamento desativado. Os dados existentes foram preservados; o rascunho atual é temporário.';
      return;
    }
    if (externalPending) { markConflict(); return; }
    const snapshot = JSON.stringify(planning);
    if (snapshot === lastSnapshot) {
      if (savedLocally && status.textContent.includes('Não há salvamento permanente.')) {
        status.textContent = 'Configuração já salva localmente neste navegador.';
      }
      return;
    }
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== baseline) { markConflict(); return; }
      savePlanning(planning);
      const stored = readStable();
      if (JSON.stringify(stored.planning) !== snapshot) { markConflict(); return; }
      baseline = stored.raw;
      lastSnapshot = snapshot;
      savedLocally = true;
      if (event.type === 'submit' && forms.has(event.target)) forms.set(event.target, signature(event.target));
      updateNotice('Planejamento salvo localmente', 'Alterações confirmadas salvas. Outras abas podem receber a atualização automaticamente quando não houver rascunhos pendentes.');
      status.textContent = 'Alterações salvas localmente e disponíveis para outras abas.';
    } catch (error) {
      updateNotice('Falha ao salvar ou verificar a gravação', 'Não foi possível confirmar o salvamento. As alterações atuais permanecem em memória. Uma nova interação tentará novamente, verificando antes a versão compartilhada.');
      status.textContent = 'Salvamento não confirmado. Não feche nem recarregue esta aba para evitar perder alterações.';
      console.error('Falha na persistência.', error);
    }
  };
  root.addEventListener('submit', persist, options);
  root.addEventListener('click', persist, options);

  const synchronize = () => {
    if (!canSave || externalPending) return;
    try {
      const current = window.localStorage.getItem(STORAGE_KEY);
      if (current === baseline) return;
      if (hasDrafts() || hasUnsavedChanges()) { markConflict(); return; }
      readStable();
      bootstrap(root);
      root.querySelector('[role="status"]').textContent = current === null
        ? 'O planejamento compartilhado foi removido. Um planejamento vazio foi aberto.'
        : 'Planejamento atualizado a partir de outra aba.';
    } catch (error) {
      markConflict();
      status.textContent = 'A atualização externa não pôde ser validada. O conteúdo desta aba foi mantido.';
      console.error('Falha na sincronização entre abas.', error);
    }
  };
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
      synchronize();
    } catch (error) {
      markConflict();
      console.error('Armazenamento indisponível.', error);
    }
  }, options);
  window.addEventListener('focus', synchronize, options);
  return planning;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
} else {
  bootstrap();
}
