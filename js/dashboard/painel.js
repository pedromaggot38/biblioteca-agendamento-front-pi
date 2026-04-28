document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  let isVerified = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isVerified = !!payload.is_verified;
    } catch (e) {
      console.error('Erro ao decodificar token');
    }
  }

  const feedbackSessao = localStorage.getItem('feedback_sessao');
  const feedbackAgendamento = localStorage.getItem('feedback_agendamento');
  const origemLogin = localStorage.getItem('origem_login');

  if (feedbackSessao === 'restaurada' && origemLogin !== 'manual') {
    mostrarNotificacao('Bem-vindo de volta! Sessão restaurada.', 'sucesso');
  }
  if (feedbackAgendamento === 'excluido') {
    mostrarNotificacao('Agendamento excluído com sucesso!', 'sucesso');
    localStorage.removeItem('feedback_agendamento');
  }

  localStorage.removeItem('feedback_sessao');
  localStorage.removeItem('origem_login');

  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const corpoTabela = document.getElementById('corpoTabela');
  const containerPaginacao = document.getElementById('paginacao');

  const inputPesquisa = document.getElementById('inputPesquisa');
  const btnExecutarPesquisa = document.getElementById('btnExecutarPesquisa');
  const selectStatus = document.getElementById('selectStatus');
  const btnLimparFiltros = document.getElementById('btnLimparFiltros');

  let paginaAtual = 1;

  if (inputPesquisa) {
    inputPesquisa.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') carregarAgendamentos(1);
    });
  }
  if (btnExecutarPesquisa) {
    btnExecutarPesquisa.addEventListener('click', () =>
      carregarAgendamentos(1),
    );
  }
  if (selectStatus) {
    selectStatus.addEventListener('change', () => carregarAgendamentos(1));
  }
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener('click', () => {
      inputPesquisa.value = '';
      selectStatus.value = '';
      carregarAgendamentos(1);
    });
  }

  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  function mostrarNotificacao(mensagem, tipo = 'padrao') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fadeOut');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  }

  async function carregarAgendamentos(pagina = 1) {
    try {
      const search = inputPesquisa ? inputPesquisa.value.trim() : '';
      const status = selectStatus ? selectStatus.value : '';

      let urlParams = new URLSearchParams({
        page: pagina,
        limit: 10,
      });

      if (search) urlParams.append('search', search);
      if (status) urlParams.append('status', status);

      const urlFinal = `${API_BASE_URL}/agendamentos?${urlParams.toString()}`;

      const resposta = await fetch(urlFinal, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resposta.ok) {
        const pacote = await resposta.json();
        const lista = pacote.data?.agendamentos || pacote.data || [];
        const infoPaginacao = pacote.data?.pagination;

        paginaAtual = pagina;
        desenharTabela(lista);

        if (infoPaginacao) {
          renderizarPaginacao(infoPaginacao);
        }
      } else {
        if (resposta.status === 401) logout();
        mostrarNotificacao('Erro ao carregar lista.', 'erro');
      }
    } catch (erro) {
      mostrarNotificacao('Servidor offline.', 'erro');
    }
  }

  function formatarDataBR(dataIso) {
    if (!dataIso) return '---';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function desenharTabela(agendamentos) {
    corpoTabela.innerHTML = '';

    if (agendamentos.length === 0) {
      corpoTabela.innerHTML =
        '<tr><td colspan="9" style="text-align: center;">Nenhum agendamento encontrado.</td></tr>';
      return;
    }

    agendamentos.forEach((item) => {
      const servicos = [];
      if (item.servico_levantamento) servicos.push('Levantamento');
      if (item.servico_normalizacao) servicos.push('Normalização');

      let statusClasse = 'status-';
      if (item.status === 'APROVADO') statusClasse += 'aprovado';
      else if (item.status === 'RECUSADO') statusClasse += 'recusado';
      else statusClasse += 'pendente';

      const tooltipAviso = !isVerified
        ? 'Confirme seu e-mail no Perfil para gerenciar'
        : '';
      const disabledAttr =
        !isVerified || item.status !== 'PENDENTE' ? 'disabled' : '';

      const linha = document.createElement('tr');
      linha.innerHTML = `
                <td>${item.rm}</td>
                <td>${item.nome}</td>
                <td>${item.curso}</td>
                <td>${item.email}</td>
                <td>${servicos.join(' + ')}</td>
                <td>${formatarDataBR(item.data)}</td>
                <td>${item.horario}</td>
                <td><span class="${statusClasse}">${item.status}</span></td>
                <td class="acoes">
                    <button class="btn-visualizar" title="Ver Detalhes" onclick="verDetalhes(${item.id})">🔍</button>
                    <button class="btn-aprovar" title="${tooltipAviso || 'Aprovar'}" onclick="alterarStatus(${item.id}, 'APROVADO')" ${disabledAttr}>✓</button>
                    <button class="btn-recusar" title="${tooltipAviso || 'Recusar'}" onclick="alterarStatus(${item.id}, 'RECUSADO')" ${disabledAttr}>✕</button>
                    <button class="btn-recusar" title="Excluir Permanentemente" onclick="excluirAgendamentoDireto(${item.id})" ${!isVerified ? 'disabled' : ''}>🗑️</button>
                </td>
            `;
      corpoTabela.appendChild(linha);
    });
  }

  window.excluirAgendamentoDireto = async function (id) {
    if (!isVerified)
      return mostrarNotificacao(
        'Verifique sua conta para excluir registros.',
        'erro',
      );

    const confirmou = await pedirConfirmacao({
      titulo: 'Excluir permanentemente?',
      mensagem:
        'Esta ação removerá o registro do banco de dados e não pode ser desfeita.',
      tipo: 'perigo',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
    });

    if (!confirmou) return;

    try {
      const resposta = await fetch(`${API_BASE_URL}/agendamentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resposta.ok) {
        mostrarNotificacao('Agendamento removido com sucesso!', 'sucesso');
        carregarAgendamentos(paginaAtual);
      } else {
        const erro = await resposta.json();
        mostrarNotificacao(
          erro.message || 'Erro ao excluir agendamento.',
          'erro',
        );
      }
    } catch (err) {
      mostrarNotificacao('Falha na conexão com o servidor.', 'erro');
    }
  };

  window.alterarStatus = async function (id, novoStatus) {
    if (!isVerified)
      return mostrarNotificacao(
        'Verifique sua conta para alterar status.',
        'erro',
      );

    const ehAprovado = novoStatus === 'APROVADO';

    const confirmou = await pedirConfirmacao({
      titulo: ehAprovado ? 'Confirmar Agendamento?' : 'Recusar Agendamento?',
      mensagem: ehAprovado
        ? 'O aluno receberá uma confirmação por e-mail.'
        : 'Esta ação não poderá ser desfeita após confirmada.',
      tipo: ehAprovado ? 'sucesso' : 'perigo',
    });

    if (!confirmou) return;

    try {
      const resposta = await fetch(`${API_BASE_URL}/agendamentos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      const json = await resposta.json();

      if (resposta.ok) {
        const mensagemBanco =
          json.message || `Agendamento ${novoStatus.toLowerCase()}!`;

        const tipoNotificacao = mensagemBanco.includes('erro')
          ? 'aviso'
          : 'sucesso';

        mostrarNotificacao(mensagemBanco, tipoNotificacao);
        carregarAgendamentos(paginaAtual);
      } else {
        mostrarNotificacao(json.message || 'Erro ao alterar status', 'erro');
      }
    } catch (err) {
      mostrarNotificacao('Falha na conexão.', 'erro');
    }
  };

  function criarBotaoPagina(numeroPagina, paginaAtualRef) {
    const btn = document.createElement('button');
    btn.innerText = numeroPagina;
    btn.className = 'btn-paginacao';
    if (numeroPagina === paginaAtualRef) btn.classList.add('ativo');
    btn.onclick = () => carregarAgendamentos(numeroPagina);
    return btn;
  }

  function renderizarPaginacao(paginacao) {
    if (!containerPaginacao) return;
    containerPaginacao.innerHTML = '';
    if (paginacao.totalPages <= 1) return;

    const { page: paginaAtualRef, totalPages: totalPaginas } = paginacao;

    const btnAnterior = document.createElement('button');
    btnAnterior.innerText = '«';
    btnAnterior.className = 'btn-paginacao nav-seta';
    btnAnterior.disabled = paginaAtualRef === 1;
    btnAnterior.onclick = () => carregarAgendamentos(paginaAtualRef - 1);
    containerPaginacao.appendChild(btnAnterior);

    let startPage = Math.max(1, paginaAtualRef - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
      containerPaginacao.appendChild(criarBotaoPagina(1, paginaAtualRef));
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.innerText = '...';
        dots.className = 'dots-paginacao';
        containerPaginacao.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      containerPaginacao.appendChild(criarBotaoPagina(i, paginaAtualRef));
    }

    if (endPage < totalPaginas) {
      if (endPage < totalPaginas - 1) {
        const dots = document.createElement('span');
        dots.innerText = '...';
        dots.className = 'dots-paginacao';
        containerPaginacao.appendChild(dots);
      }
      containerPaginacao.appendChild(
        criarBotaoPagina(totalPaginas, paginaAtualRef),
      );
    }

    const btnProxima = document.createElement('button');
    btnProxima.innerText = '»';
    btnProxima.className = 'btn-paginacao nav-seta';
    btnProxima.disabled = paginaAtualRef === totalPaginas;
    btnProxima.onclick = () => carregarAgendamentos(paginaAtualRef + 1);
    containerPaginacao.appendChild(btnProxima);
  }

  window.verDetalhes = function (id) {
    window.location.href = `./agendamento.html?id=${id}`;
  };

  carregarAgendamentos(1);
});

window.logout = async function () {
  const confirmou = await pedirConfirmacao({
    titulo: 'Encerrar Sessão?',
    mensagem: 'Você será desconectado do painel de gestão. Deseja sair?',
    tipo: 'perigo',
    textoConfirmar: 'Sair agora',
    textoCancelar: 'Permanecer',
  });

  if (!confirmou) return;

  localStorage.removeItem('token');
  window.location.href = './../auth.html';
};
