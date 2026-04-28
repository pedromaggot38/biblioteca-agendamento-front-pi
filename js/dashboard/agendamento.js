document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const token = localStorage.getItem('token');

  const params = new URLSearchParams(window.location.search);
  const agendamentoId = params.get('id');

  function formatarDataBR(dataIso) {
    if (!dataIso) return '---';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  async function buscarDetalhes() {
    try {
      const res = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await res.json();

      if (res.ok) {
        preencherFicha(dados.data);
      } else {
        mostrarNotificacao('Agendamento não encontrado.', 'erro');
        setTimeout(() => (window.location.href = 'painel.html'), 2000);
      }
    } catch (err) {
      mostrarNotificacao('Erro ao conectar com o servidor.', 'erro');
    }
  }

  function preencherFicha(item) {
    document.getElementById('detalheNome').textContent = item.nome;
    document.getElementById('detalheRM').textContent = item.rm;
    document.getElementById('detalheCurso').textContent = item.curso;
    document.getElementById('detalheEmail').textContent = item.email;
    document.getElementById('detalheData').textContent = formatarDataBR(
      item.data,
    );
    document.getElementById('detalheHorario').textContent = item.horario;

    const servicos = [];
    if (item.servico_levantamento) servicos.push('Levantamento');
    if (item.servico_normalizacao) servicos.push('Normalização');
    document.getElementById('detalheServicos').textContent =
      servicos.join(' e ');

    const statusEl = document.getElementById('detalheStatus');
    statusEl.textContent = item.status;
    statusEl.className = `status-badge status-${item.status.toLowerCase()}`;

    if (item.status === 'PENDENTE') {
      document.getElementById('acoesAgendamento').style.display = 'flex';
    } else {
      document.getElementById('acoesAgendamento').style.display = 'none';
    }
  }

  window.apagarAgendamento = async () => {
    const confirmou = await pedirConfirmacao({
      titulo: 'Excluir permanentemente?',
      mensagem:
        'Esta ação removerá o registro do banco de dados e não pode ser desfeita.',
      tipo: 'perigo',
    });

    if (!confirmou) return;

    try {
      const res = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        localStorage.setItem('feedback_agendamento', 'excluido');

        window.location.href = './painel.html';
      } else {
        const erro = await res.json();
        mostrarNotificacao(erro.message || 'Erro ao excluir.', 'erro');
      }
    } catch (err) {
      mostrarNotificacao('Falha na conexão.', 'erro');
    }
  };

  window.processarAgendamento = async (novoStatus) => {
    const ehAprovado = novoStatus === 'APROVADO';

    const confirmou = await pedirConfirmacao({
      titulo: ehAprovado ? 'Aprovar Agendamento?' : 'Recusar Agendamento?',
      mensagem: ehAprovado
        ? `Confirmar o atendimento para ${document.getElementById('detalheNome').textContent}?`
        : 'Tem certeza que deseja recusar este pedido?',
      tipo: ehAprovado ? 'sucesso' : 'perigo',
    });

    if (!confirmou) return;

    try {
      const res = await fetch(`${API_BASE_URL}/agendamentos/${agendamentoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (res.ok) {
        mostrarNotificacao(
          `Agendamento ${novoStatus.toLowerCase()}!`,
          'sucesso',
        );
        buscarDetalhes();
      } else {
        const erro = await res.json();
        mostrarNotificacao(erro.message || 'Erro ao atualizar status.', 'erro');
      }
    } catch (err) {
      mostrarNotificacao('Falha na conexão.', 'erro');
    }
  };

  buscarDetalhes();
});
