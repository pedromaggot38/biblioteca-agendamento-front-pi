document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const formAgendamento = document.getElementById('formAgendamento');
  const inputRm = document.getElementById('rm');
  const inputEmail = document.getElementById('email');
  const inputData = document.getElementById('data');
  const selectHorario = document.getElementById('horario');

  const hoje = new Date().toISOString().split('T')[0];
  if (inputData) {
    inputData.setAttribute('min', hoje);
    inputData.addEventListener('change', carregarHorariosDisponiveis);
  }

  async function carregarHorariosDisponiveis() {
    const dataSelecionada = inputData.value;
    if (!dataSelecionada) return;

    selectHorario.disabled = true;
    selectHorario.innerHTML =
      '<option value="" disabled selected>Consultando horários...</option>';

    try {
      const resposta = await fetch(
        `${API_BASE_URL}/agendamentos/disponibilidade?data=${dataSelecionada}`,
      );
      const resultado = await resposta.json();

      if (resultado.status === 'success') {
        selectHorario.innerHTML =
          '<option value="" disabled selected>Escolha um horário...</option>';

        if (resultado.data.length === 0) {
          mostrarNotificacao('Não há horários livres para este dia.', 'aviso');
          selectHorario.innerHTML =
            '<option value="" disabled selected>Sem horários disponíveis</option>';
        } else {
          resultado.data.forEach((hora) => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            selectHorario.appendChild(option);
          });
          selectHorario.disabled = false;
        }
      }
    } catch (erro) {
      mostrarNotificacao('Erro ao carregar horários.', 'erro');
    }
  }

  if (formAgendamento) {
    formAgendamento.addEventListener('submit', async (event) => {
      event.preventDefault();

      const rmValue = inputRm.value.trim();
      const emailValue = inputEmail.value.trim();
      const nomeValue = document.getElementById('nome').value.trim();
      const cursoValue = document.getElementById('curso').value.trim();
      const dataValue = inputData.value;
      const horarioValue = selectHorario.value;

      if (rmValue.length !== 5 || isNaN(rmValue)) {
        return mostrarNotificacao(
          'O RM deve conter exatamente 5 números.',
          'aviso',
        );
      }

      if (!nomeValue) {
        return mostrarNotificacao(
          'Por favor, informe seu nome completo.',
          'aviso',
        );
      }

      if (!emailValue.endsWith('@etec.sp.gov.br')) {
        return mostrarNotificacao(
          'Use seu e-mail institucional (@etec.sp.gov.br).',
          'aviso',
        );
      }

      if (!cursoValue) {
        return mostrarNotificacao('Informe seu curso técnico.', 'aviso');
      }

      const checkboxes = document.querySelectorAll(
        'input[name="servico"]:checked',
      );
      const servicos = Array.from(checkboxes).map((cb) =>
        cb.value.toLowerCase(),
      );

      if (servicos.length === 0) {
        return mostrarNotificacao('Selecione pelo menos um serviço.', 'aviso');
      }

      if (!dataValue || !horarioValue) {
        return mostrarNotificacao(
          'Selecione a data e um horário disponível.',
          'aviso',
        );
      }

      const dadosAgendamento = {
        rm: rmValue,
        nome: nomeValue,
        email: emailValue,
        curso: cursoValue,
        servico_levantamento: servicos.some((s) => s.includes('levantamento')),
        servico_normalizacao: servicos.some((s) => s.includes('normaliza')),
        data: dataValue,
        horario: horarioValue,
      };

      try {
        const resposta = await fetch(`${API_BASE_URL}/agendamentos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosAgendamento),
        });

        if (resposta.ok) {
          window.location.href = 'pages/confirmacao.html';
        } else {
          const erroJson = await resposta.json();
          mostrarNotificacao(
            erroJson.message || 'Erro ao realizar agendamento',
            'erro',
          );
        }
      } catch (erro) {
        mostrarNotificacao(
          'Servidor offline. Verifique o ambiente Docker.',
          'erro',
        );
      }
    });
  }
});
