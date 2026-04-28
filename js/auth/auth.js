document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const loadingStatus = document.getElementById('loadingStatus');
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');

  const params = new URLSearchParams(window.location.search);
  const mensagemErro = params.get('erro');

  if (mensagemErro) {
    mostrarNotificacao(mensagemErro, 'erro');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const tokenGuardado = localStorage.getItem('token');

  if (tokenGuardado) {
    try {
      const respostaMe = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenGuardado}` },
      });

      if (respostaMe.ok) {
        localStorage.setItem('feedback_sessao', 'restaurada');
        window.location.href = 'dashboard/painel.html';
        return;
      } else {
        localStorage.removeItem('token');
        mostrarNotificacao(
          'Sua sessão expirou. Por favor, faça login novamente.',
          'aviso',
        );
      }
    } catch (erro) {
      console.error('Erro ao validar sessão:', erro);
    }
  }

  try {
    const respostaStatus = await fetch(`${API_BASE_URL}/auth/status`);
    const dadosStatus = await respostaStatus.json();

    loadingStatus.style.display = 'none';

    if (dadosStatus.data && dadosStatus.data.inicializado) {
      formLogin.style.display = 'block';
      formRegistro.style.display = 'none';
    } else {
      mostrarNotificacao(
        'Primeiro acesso detectado. Crie o administrador.',
        'aviso',
      );
      formLogin.style.display = 'none';
      formRegistro.style.display = 'block';
    }
  } catch (erro) {
    loadingStatus.innerHTML =
      "<p style='color: red;'>Erro ao conectar com o servidor.</p>";
  }

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('emailLogin').value;
      const senha = document.getElementById('senhaLogin').value;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: senha }),
        });

        const dados = await res.json();

        if (res.ok) {
          localStorage.setItem('token', dados.data.token);
          localStorage.setItem('origem_login', 'manual');
          window.location.href = 'dashboard/painel.html';
        } else {
          mostrarNotificacao(dados.message || 'Credenciais inválidas', 'erro');
        }
      } catch (erro) {
        mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
      }
    });
  }

  if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeRegistro').value;
      const email = document.getElementById('emailRegistro').value;
      const senha = document.getElementById('senhaRegistro').value;
      const senhaConfirm = document.getElementById(
        'senhaRegistroConfirm',
      ).value;

      if (senha !== senhaConfirm) {
        mostrarNotificacao('As senhas não coincidem!', 'aviso');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            email,
            password: senha,
            passwordConfirm: senhaConfirm,
          }),
        });

        const resposta = await res.json();

        if (res.ok) {
          localStorage.setItem('token', resposta.data.token);
          localStorage.setItem('usuario', JSON.stringify(resposta.data.user));

          mostrarNotificacao(
            'Registro concluído! Redirecionando...',
            'sucesso',
          );

          setTimeout(() => {
            window.location.href = 'dashboard/painel.html';
          }, 1300);
        } else {
          mostrarNotificacao(resposta.message || 'Erro ao registrar', 'erro');
        }
      } catch (erro) {
        mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
      }
    });
  }
});
