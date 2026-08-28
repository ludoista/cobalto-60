// ================================================================
// Modal "Novo Evento" — abrir/fechar e submissão do formulário.
// ================================================================
import { modalEvento, btnNovoEvento, eventoMateriasLista } from './dom.js';
import { criarEvento } from './eventosApi.js';
import { renderizarChecklistMaterias, lerMateriasSelecionadas } from './materiasUi.js';

export function iniciarModalNovoEvento() {
  btnNovoEvento.onclick = () => {
    renderizarChecklistMaterias(eventoMateriasLista);
    modalEvento.style.display = 'block';
  };
  document.getElementById('btn-fechar-modal').onclick = () => modalEvento.style.display = 'none';

  document.getElementById('form-novo-evento').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
      titulo: document.getElementById('evento-titulo').value,
      tipo: document.getElementById('evento-tipo').value,
      data: document.getElementById('evento-data').value,
      horario: document.getElementById('evento-horario').value || null,
      lugar: document.getElementById('evento-lugar').value || null,
    };
    const materiaIds = lerMateriasSelecionadas(eventoMateriasLista);

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.innerText = "Salvando...";
    btnSubmit.disabled = true;

    const { error } = await criarEvento(dados, materiaIds);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      btnSubmit.innerText = "Salvar no Calendário";
      btnSubmit.disabled = false;
    } else {
      window.location.reload();
    }
  });
}
