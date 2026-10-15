import { createPlanning } from './domain/planning.js';
import { renderApp } from './components/App.js';
import { loadPlanning, savePlanning } from './services/storage.js';

const sessions = new WeakMap();

export function bootstrap(root = document.getElementById('app')) {
  if (!root) throw new Error('Elemento #app não encontrado.');
  sessions.get(root)?.abort();
  const controller = new AbortController();
  sessions.set(root, controller);
  let planning = createPlanning();
  let canSave = true;
  let restored = false;
  try {
    const stored = loadPlanning();
    if (stored) { planning = stored; restored = true; }
  } catch (error) {
    canSave = false;
    console.error('Falha ao restaurar o planejamento local.', error);
  }
  renderApp(root, planning);
  const notice = root.querySelector('.notice');
  const noticeTitle = notice.querySelector('h2');
  const noticeText = notice.querySelector('p');
  const status = root.querySelector('[role="status"]');
  const limitations = ' Apenas um planejamento neste navegador e endereço, sem sincronização entre dispositivos ou abas. Limpar os dados do site pode apagar o planejamento. Calendário e conflitos de horário ainda não estão implementados.';
  const updateNotice = (title, message) => {
    noticeTitle.textContent = title;
    noticeText.textContent = message + limitations;
  };
  if (canSave) {
    updateNotice('Salvamento local automático', restored
      ? 'Planejamento restaurado. Alterações confirmadas serão salvas neste navegador.'
      : 'Alterações confirmadas serão salvas neste navegador. Formulários ainda não confirmados não são salvos.');
  } else {
    updateNotice('Falha na leitura: salvamento desativado',
      'Não foi possível ler ou validar os dados locais. O conteúdo existente não será sobrescrito nesta sessão. Você está usando um rascunho temporário; alterações serão perdidas ao fechar ou recarregar.');
  }
  let lastSnapshot = JSON.stringify(planning);
  let savedLocally = restored;
  const persist = () => {
    const snapshot = JSON.stringify(planning);
    if (!canSave) {
      status.textContent = 'Salvamento desativado nesta sessão. Os dados existentes foram preservados; o rascunho atual é temporário.';
      return;
    }
    if (snapshot === lastSnapshot) {
      if (savedLocally && status.textContent.includes('Não há salvamento permanente.')) {
        status.textContent = 'Configuração já salva localmente neste navegador.';
      }
      return;
    }
    try {
      savePlanning(planning);
      lastSnapshot = snapshot;
      savedLocally = true;
      updateNotice('Planejamento salvo localmente', 'Última alteração confirmada salva neste navegador. Formulários ainda não confirmados não são salvos.');
      status.textContent = 'Alterações salvas localmente neste navegador.';
    } catch (error) {
      updateNotice('Falha ao salvar', 'As alterações atuais estão apenas em memória. O último salvamento bem-sucedido, se existente, permanece. Uma nova interação tentará salvar novamente.');
      status.textContent = 'Não foi possível salvar. Não feche nem recarregue a página para evitar perder as alterações atuais.';
      console.error('Falha ao salvar o planejamento local.', error);
    }
  };
  root.addEventListener('submit', persist, { signal: controller.signal });
  root.addEventListener('click', persist, { signal: controller.signal });
  return planning;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
} else {
  bootstrap();
}
