// ================================================================
// Modal de detalhes — visualizar, editar e excluir um evento.
// ================================================================
import { modalDetalhes, painelVisualizacao, formEdicao, acoesDono, editarMateriasLista } from './dom.js';
import { estado } from './estado.js';
import { atualizarEvento, excluirEvento } from './eventosApi.js';
import { renderizarChecklistMaterias, lerMateriasSelecionadas } from './materiasUi.js';

export function abrirModalDetalhes(evento) {
  estado.eventoSelecionadoId = evento.id;
  const { tipo, horario, autor_nome, lugar, materias } = evento.extendedProps;

  document.getElementById('detalhes-titulo').innerText = evento.title;
  document.getElementById('detalhes-tipo').innerText = tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  document.getElementById('detalhes-data').innerText = evento.start.toLocaleDateString('pt-BR');
  document.getElementById('detalhes-autor').innerText = autor_nome || 'anônimo';

  const linhaHorario = document.getElementById('detalhes-horario-linha');
  if (horario) {
    linhaHorario.style.display = 'block';
    document.getElementById('detalhes-horario').innerText = horario.substring(0, 5);
  } else {
    linhaHorario.style.display = 'none';
  }

  const linhaLugar = document.getElementById('detalhes-lugar-linha');
  if (lugar) {
    linhaLugar.style.display = 'block';
    document.getElementById('detalhes-lugar').innerText = lugar;
  } else {
    linhaLugar.style.display = 'none';
  }

  const linhaMaterias = document.getElementById('detalhes-materias-linha');
  if (materias && materias.length > 0) {
    linhaMaterias.style.display = 'block';
    document.getElementById('detalhes-materias').innerText = materias.map(m => m.nome).join(', ');
  } else {
    linhaMaterias.style.display = 'none';
  }

  acoesDono.style.display = estado.usuarioAtualId ? 'flex' : 'none';

  painelVisualizacao.style.display = 'block';
  formEdicao.style.display = 'none';

  modalDetalhes.style.display = 'block';
}

export function iniciarModalDetalhes() {
  document.getElementById('btn-fechar-detalhes').onclick = () => {
    modalDetalhes.style.display = 'none';
  };

  document.getElementById('btn-editar-evento').onclick = () => {
    const evento = estado.calendar.getEventById(estado.eventoSelecionadoId);
    const { tipo, data, horario, lugar, materias } = evento.extendedProps;

    document.getElementById('editar-titulo').value = evento.title;
    document.getElementById('editar-tipo').value = tipo;
    document.getElementById('editar-data').value = data;
    document.getElementById('editar-horario').value = horario ? horario.substring(0, 5) : '';
    document.getElementById('editar-lugar').value = lugar || '';

    renderizarChecklistMaterias(editarMateriasLista, (materias || []).map(m => m.id));

    painelVisualizacao.style.display = 'none';
    formEdicao.style.display = 'block';
  };

  document.getElementById('btn-cancelar-edicao').onclick = () => {
    formEdicao.style.display = 'none';
    painelVisualizacao.style.display = 'block';
  };

  formEdicao.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSalvar = e.target.querySelector('button[type="submit"]');
    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    const dados = {
      titulo: document.getElementById('editar-titulo').value,
      tipo: document.getElementById('editar-tipo').value,
      data: document.getElementById('editar-data').value,
      horario: document.getElementById('editar-horario').value || null,
      lugar: document.getElementById('editar-lugar').value || null,
    };
    const materiaIds = lerMateriasSelecionadas(editarMateriasLista);

    const { error } = await atualizarEvento(estado.eventoSelecionadoId, dados, materiaIds);

    if (error) {
      alert("Erro ao editar: " + error.message);
      btnSalvar.innerText = "Salvar Alterações";
      btnSalvar.disabled = false;
    } else {
      window.location.reload();
    }
  });

  document.getElementById('btn-excluir-evento').onclick = async () => {
    const confirmar = confirm("Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita.");
    if (!confirmar) return;

    const { error } = await excluirEvento(estado.eventoSelecionadoId);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      window.location.reload();
    }
  };
}
