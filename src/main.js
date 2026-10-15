import { createPlanning } from './domain/planning.js';
import { renderApp } from './components/App.js';

export function bootstrap(root = document.getElementById('app')) {
  if (!root) {
    throw new Error('Elemento #app não encontrado.');
  }
  const planning = createPlanning();
  renderApp(root, planning);
  return planning;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
} else {
  bootstrap();
}
