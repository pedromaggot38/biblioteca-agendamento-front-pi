document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const token = localStorage.getItem('token');

  const tabDados = document.getElementById('tabDados');
  const tabSenha = document.getElementById('tabSenha');
  const formPerfil = document.getElementById('formPerfil');
  const formSenha = document.getElementById('formSenha');

  const nomeInput = document.getElementById('nomeAdmin');
  const emailInput = document.getElementById('emailAdmin');

  tabDados.addEventListener('click', () => {
    formPerfil.style.display = 'block';
    formSenha.style.display = 'none';
    tabDados.style.borderBottom = '2px solid #2c3e50';
    tabDados.style.color = '#000';
    tabSenha.style.borderBottom = 'none';
    tabSenha.style.color = '#666';
  });

  tabSenha.addEventListener('click', () => {
    formPerfil.style.display = 'none';
    formSenha.style.display = 'block';
    tabSenha.style.borderBottom = '2px solid #2c3e50';
    tabSenha.style.color = '#000';
    tabDados.style.borderBottom = 'none';
    tabDados.style.color = '#666';
  });

  async function carregarDados() {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const pacote = await res.json();
        const user = pacote.data.user || pacote.data;
        nomeInput.value = user.nome;
        emailInput.value = user.email;
      }
    } catch (e) {
      mostrarNotificacao('Erro ao carregar dados.', 'erro');
    }
  }

  formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!nomeInput.value.trim() || !emailInput.value.trim()) {
      return mostrarNotificacao(
        'Por favor, preencha todos os campos do perfil.',
        'aviso',
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nomeInput.value,
          email: emailInput.value,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        const usuarioAtualizado = json.data.user || json.data;

        nomeInput.value = usuarioAtualizado.nome;
        emailInput.value = usuarioAtualizado.email;

        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));

        mostrarNotificacao('Dados atualizados com sucesso!', 'sucesso');
      } else {
        mostrarNotificacao(json.message || 'Erro ao atualizar', 'erro');
      }
    } catch (e) {
      mostrarNotificacao('Erro de conexão.', 'erro');
    }
  });

  formSenha.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('senhaAtual').value;
    const newPassword = document.getElementById('novaSenha').value;
    const passwordConfirm = document.getElementById('confirmarSenha').value;

    if (!currentPassword || !newPassword || !passwordConfirm) {
      return mostrarNotificacao(
        'Todos os campos de senha são obrigatórios.',
        'aviso',
      );
    }

    if (newPassword !== passwordConfirm) {
      return mostrarNotificacao('As novas senhas não coincidem!', 'aviso');
    }

    if (newPassword.length < 4) {
      return mostrarNotificacao(
        'A nova senha deve ter no mínimo 4 caracteres.',
        'aviso',
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, passwordConfirm }),
      });

      const json = await res.json();

      if (res.ok) {
        mostrarNotificacao('Senha alterada com sucesso!', 'sucesso');
        formSenha.reset();
      } else {
        const erroMensagem =
          json.erros?.[0]?.mensagem ||
          json.message ||
          'Erro ao processar solicitação';

        mostrarNotificacao(erroMensagem, 'erro');
      }
    } catch (e) {
      mostrarNotificacao('Erro de conexão com o servidor.', 'erro');
    }
  });

  carregarDados();
});
