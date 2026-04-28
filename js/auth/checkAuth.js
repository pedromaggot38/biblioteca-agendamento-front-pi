(async function () {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '../auth.html';
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resposta.ok) {
      const erroDados = await resposta.json();
      const mensagem = erroDados.message || 'Erro de validação.';

      if (resposta.status === 401) {
        localStorage.removeItem('token');
        window.location.href = `../auth.html?erro=${encodeURIComponent(mensagem)}`;
      } else {
        window.location.href = `../404.html?status=${resposta.status}&msg=${encodeURIComponent(mensagem)}`;
      }
      return;
    }
  } catch (erro) {
    window.location.href = `../404.html?status=Offline&msg=O servidor não está respondendo. Verifique se o back-end está rodando.`;
  }
})();
