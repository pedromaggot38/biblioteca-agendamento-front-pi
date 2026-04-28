const API_URL = 'http://localhost:3000/api/v1';

const formSolicitarCodigo = document.getElementById('formSolicitarCodigo');
const formRedefinirSenha = document.getElementById('formRedefinirSenha');

const btnSolicitar = document.getElementById('btnSolicitar');
const btnRedefinir = document.getElementById('btnRedefinir');

formSolicitarCodigo.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('emailRecuperacao').value;

  btnSolicitar.disabled = true;
  btnSolicitar.textContent = 'Enviando...';

  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao solicitar código.');
    }

    formSolicitarCodigo.style.display = 'none';
    formRedefinirSenha.style.display = 'block';
    mostrarNotificacao('Se o e-mail existir, o código foi enviado.', 'sucesso');
  } catch (error) {
    mostrarNotificacao(error.message, 'erro');
  } finally {
    btnSolicitar.disabled = false;
    btnSolicitar.textContent = 'Enviar Código';
  }
});

formRedefinirSenha.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('token').value;
  const password = document.getElementById('novaSenha').value;
  const passwordConfirm = document.getElementById('confirmaSenha').value;

  if (password !== passwordConfirm) {
    mostrarNotificacao('As senhas não coincidem.', 'erro');
    return;
  }

  btnRedefinir.disabled = true;
  btnRedefinir.textContent = 'Redefinindo...';

  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, passwordConfirm }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao redefinir senha.');
    }

    mostrarNotificacao(
      'Senha redefinida com sucesso. Redirecionando...',
      'sucesso',
    );

    setTimeout(() => {
      window.location.href = './auth.html';
    }, 2000);
  } catch (error) {
    mostrarNotificacao(error.message, 'erro');
    btnRedefinir.disabled = false;
    btnRedefinir.textContent = 'Redefinir Senha';
  }
});
