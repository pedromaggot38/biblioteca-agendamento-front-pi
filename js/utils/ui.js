// ==========================================
// 1. SISTEMA DE NOTIFICAÇÃO (TOAST)
// ==========================================
if (!document.getElementById('toast-container')) {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

function mostrarNotificacao(mensagem, tipo = 'padrao') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerText = mensagem;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fadeOut');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// ==========================================
// 2. MODAL DE CONFIRMAÇÃO CUSTOMIZADO
// ==========================================
const modalEstilo = `
<div id="custom-confirm" class="confirm-overlay" style="display: none;">
    <div class="confirm-box">
        <h3 id="confirm-titulo">Confirmação</h3>
        <p id="confirm-mensagem">Você tem certeza?</p>
        <div class="confirm-botoes">
            <button id="confirm-cancelar" class="btn-cancelar">Cancelar</button>
            <button id="confirm-aceitar" class="btn-confirmar">Confirmar</button>
        </div>
    </div>
</div>

<style>
.confirm-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 9999; backdrop-filter: blur(2px);
}
.confirm-box {
    background: white; padding: 25px; border-radius: 12px;
    width: 90%; max-width: 400px; text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.confirm-botoes { display: flex; gap: 10px; margin-top: 20px; }
.confirm-botoes button { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-cancelar { background: #eee; color: #333; }
.btn-confirmar { background: #28a745; color: white; }
.btn-confirmar.perigo { background: #dc3545; }
</style>
`;
document.body.insertAdjacentHTML('beforeend', modalEstilo);

function pedirConfirmacao({ titulo, mensagem, tipo = 'sucesso' }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-confirm');
    const btnAceitar = document.getElementById('confirm-aceitar');
    const btnCancelar = document.getElementById('confirm-cancelar');

    document.getElementById('confirm-titulo').innerText = titulo;
    document.getElementById('confirm-mensagem').innerText = mensagem;
    btnAceitar.className =
      tipo === 'perigo' ? 'btn-confirmar perigo' : 'btn-confirmar';

    modal.style.display = 'flex';

    const fechar = (valor) => {
      modal.style.display = 'none';
      resolve(valor);
    };

    btnAceitar.onclick = () => fechar(true);
    btnCancelar.onclick = () => fechar(false);
  });
}

function renderizarPaginacao(pagination, callbackName) {
  const { page, totalPages } = pagination;
  const container = document.getElementById('paginacao');
  if (!container) return;

  container.innerHTML = `
    <div class="paginacao-controles">
      <button ${page <= 1 ? 'disabled' : ''} onclick="window.${callbackName}(${page - 1})">←</button>
      <span>Página ${page} de ${totalPages}</span>
      <button ${page >= totalPages ? 'disabled' : ''} onclick="window.${callbackName}(${page + 1})">→</button>
    </div>
  `;
}
