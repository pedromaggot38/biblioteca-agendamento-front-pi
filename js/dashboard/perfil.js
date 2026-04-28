document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const tokenSessao = localStorage.getItem('token');

  const tabDados = document.getElementById('tabDados');
  const tabSenha = document.getElementById('tabSenha');
  const tabVerificacao = document.getElementById('tabVerificacao');
  const formPerfil = document.getElementById('formPerfil');
  const formSenha = document.getElementById('formSenha');
  const formVerificacao = document.getElementById('formVerificacao');
  const banner = document.getElementById('bannerVerificacao');
  const avisoStatus = document.getElementById('avisoStatus');
  const nomeInput = document.getElementById('nomeAdmin');
  const emailInputReadonly = document.getElementById('emailAdminReadonly');
  const displayEmailAtual = document.getElementById('displayEmailAtual');
  const textoEmailAtual = document.getElementById('textoEmailAtual');
  const btnHabilitarTroca = document.getElementById('btnHabilitarTroca');
  const containerNovoEmail = document.getElementById('containerNovoEmail');
  const emailInputEdicao = document.getElementById('emailAdmin');
  const btnGerar = document.getElementById('btnGerarCodigo');
  const btnValidar = document.getElementById('btnValidarCodigo');
  const areaCodigo = document.getElementById('areaCodigo');
  const inputCodigo = document.getElementById('codigoOTP');

  const abas = [
    { btn: tabDados, form: formPerfil },
    { btn: tabSenha, form: formSenha },
    { btn: tabVerificacao, form: formVerificacao },
  ];

  function alternarAba(abaAlvo) {
    abas.forEach((aba) => {
      if (aba.btn) {
        aba.btn.classList.remove('ativa');
        aba.btn.style.borderBottom = 'none';
        aba.btn.style.color = '#95a5a6';
      }
      if (aba.form) aba.form.style.display = 'none';
    });
    abaAlvo.btn.classList.add('ativa');
    abaAlvo.btn.style.borderBottom = '3px solid #2c3e50';
    abaAlvo.btn.style.color = '#2c3e50';
    abaAlvo.form.style.display = 'block';
  }

  tabDados?.addEventListener('click', () => alternarAba(abas[0]));
  tabSenha?.addEventListener('click', () => alternarAba(abas[1]));
  tabVerificacao?.addEventListener('click', () => alternarAba(abas[2]));

  window.irParaAbaVerificacao = () => tabVerificacao?.click();

  function atualizarInterfaceVerificacao(user) {
    if (!user) return;
    if (!user.is_verified) {
      if (banner) banner.style.display = 'block';
      if (avisoStatus)
        avisoStatus.innerText = `Sua conta ainda não foi verificada.`;
    } else {
      if (banner) banner.style.display = 'none';
      if (avisoStatus) {
        avisoStatus.innerHTML =
          '<span style="color: #27ae60; font-weight: bold;">✓ Sua conta está verificada e segura.</span>';
        avisoStatus.style.background = '#eafaf1';
        avisoStatus.style.borderLeftColor = '#27ae60';
      }
      if (btnGerar && user.is_verified) btnGerar.style.display = 'none';
    }
  }

  async function carregarDados() {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${tokenSessao}` },
      });
      if (res.ok) {
        const pacote = await res.json();
        const user = pacote.data.user || pacote.data;
        nomeInput.value = user.nome;
        emailInputReadonly.value = user.email;
        textoEmailAtual.innerText = user.email;
        emailInputEdicao.value = user.email;
        localStorage.setItem('user', JSON.stringify(user));
        atualizarInterfaceVerificacao(user);
      }
    } catch (e) {
      mostrarNotificacao('Erro ao carregar dados do servidor.', 'erro');
    }
  }

  btnHabilitarTroca?.addEventListener('click', () => {
    containerNovoEmail.style.display = 'block';
    displayEmailAtual.style.display = 'none';

    if (btnGerar) btnGerar.style.display = 'block';

    emailInputEdicao.focus();
  });

  emailInputEdicao?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnGerar.click();
    }
  });

  btnGerar?.addEventListener('click', async () => {
    const userLocal = JSON.parse(localStorage.getItem('user'));
    const novoEmailDigitado = emailInputEdicao.value.trim();

    if (containerNovoEmail.style.display === 'block') {
      if (novoEmailDigitado.toLowerCase() === userLocal.email.toLowerCase()) {
        return mostrarNotificacao(
          'Este já é o seu e-mail atual. Digite um novo endereço.',
          'aviso',
        );
      }

      if (!novoEmailDigitado) {
        return mostrarNotificacao('Por favor, digite um novo e-mail.', 'aviso');
      }
    }

    const emailAlvo =
      containerNovoEmail.style.display === 'block'
        ? novoEmailDigitado
        : userLocal.email;

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenSessao}`,
        },
        body: JSON.stringify({ novoEmail: emailAlvo }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      mostrarNotificacao(json.message, 'sucesso');

      if (areaCodigo) areaCodigo.style.display = 'block';
      if (btnValidar) btnValidar.style.display = 'block';

      btnGerar.innerText = 'Reenviar Código';
      emailInputEdicao.readOnly = true;
      btnHabilitarTroca.style.display = 'none';

      if (inputCodigo) inputCodigo.focus();
    } catch (e) {
      mostrarNotificacao(e.message, 'erro');
    }
  });

  formVerificacao?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokenDigitado = inputCodigo.value.trim();
    if (tokenDigitado.length < 6)
      return mostrarNotificacao('Digite o código de 6 dígitos.', 'aviso');

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenSessao}`,
        },
        body: JSON.stringify({ token: tokenDigitado }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      localStorage.setItem('token', json.data.token);

      if (json.data.user) {
        localStorage.setItem('user', JSON.stringify(json.data.user));
      }

      mostrarNotificacao(json.message || 'E-mail validado!', 'sucesso');

      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      mostrarNotificacao(e.message, 'erro');
    }
  });

  formPerfil?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!nomeInput.value.trim())
      return mostrarNotificacao('Preencha seu nome.', 'aviso');

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenSessao}`,
        },
        body: JSON.stringify({ nome: nomeInput.value.trim() }),
      });

      const json = await res.json();
      if (res.ok) {
        const userAtu = json.data.user || json.data;
        localStorage.setItem('user', JSON.stringify(userAtu));

        const msg = json.message || 'Dados atualizados!';
        const tipo = msg.includes('Nenhuma') ? 'aviso' : 'sucesso';
        mostrarNotificacao(msg, tipo);

        carregarDados();
      } else {
        mostrarNotificacao(json.message || 'Erro ao atualizar', 'erro');
      }
    } catch (e) {
      mostrarNotificacao('Erro de conexão.', 'erro');
    }
  });

  formSenha?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('senhaAtual').value;
    const newPassword = document.getElementById('novaSenha').value;
    const passwordConfirm = document.getElementById('confirmarSenha').value;

    if (newPassword !== passwordConfirm)
      return mostrarNotificacao('Senhas não coincidem!', 'aviso');
    if (newPassword.length < 4)
      return mostrarNotificacao('Mínimo 4 caracteres.', 'aviso');

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenSessao}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, passwordConfirm }),
      });

      const json = await res.json();
      if (res.ok) {
        mostrarNotificacao(json.message || 'Senha alterada!', 'sucesso');
        formSenha.reset();
      } else {
        mostrarNotificacao(json.message || 'Erro ao alterar senha', 'erro');
      }
    } catch (e) {
      mostrarNotificacao('Erro de conexão.', 'erro');
    }
  });

  carregarDados();
});
