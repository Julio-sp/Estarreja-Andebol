/**
 * ============================================================================
 * PONTO DE ENTRADA
 * ============================================================================
 */
import {
  listenAtletas,
  addAtleta,
  updateAtleta,
  deleteAtleta,
  listenSessoes,
  addSessao,
  updateSessao,
  updateSessaoPresenca,
  deleteSessao,
  listenAvisos,
  addAviso,
  deleteAviso,
} from "./data.js";
import { renderShell, renderPainel, renderAtletas, renderSessoes, renderAvisos } from "./ui.js";
import { debounce } from "./utils.js";

const root = document.getElementById("app");

const state = {
  atletas: [],
  sessoes: [],
  avisos: [],
  loaded: { atletas: false, sessoes: false, avisos: false },
  tab: "painel",
  filtroEscalao: "Todos",
  ui: {
    showAtletaForm: false,
    showSessaoForm: false,
    editingAtletaId: null,
    editingSessaoId: null,
    openSessionId: null,
    saveStatus: "idle", // idle | saving | error
  },
};

function render() {
  const allLoaded = state.loaded.atletas && state.loaded.sessoes && state.loaded.avisos;
  if (!allLoaded) {
    root.innerHTML = `<div class="loading-screen"><div class="spinner"></div></div>`;
    return;
  }

  let content = "";
  if (state.tab === "painel") content = renderPainel(state);
  else if (state.tab === "atletas") content = renderAtletas(state);
  else if (state.tab === "sessoes") content = renderSessoes({ ...state, ui: { ...state.ui, openSessionId: state.ui.openSessionId } });
  else if (state.tab === "avisos") content = renderAvisos(state);

  root.innerHTML = renderShell(state, content);
}

function setUI(patch) {
  Object.assign(state.ui, patch);
  render();
}

/* ---------------------------- Firestore realtime ---------------------------- */
function markLoaded(key) {
  state.loaded[key] = true;
}

function onStoreError(err) {
  console.error(err);
  setUI({ saveStatus: "error" });
}

listenAtletas((data) => {
  state.atletas = data;
  markLoaded("atletas");
  render();
}, onStoreError);

listenSessoes((data) => {
  state.sessoes = data;
  markLoaded("sessoes");
  render();
}, onStoreError);

listenAvisos((data) => {
  state.avisos = data;
  markLoaded("avisos");
  render();
}, onStoreError);

/* ---------------------------- Notas (com debounce) ---------------------------- */
const debouncedSaveNotas = debounce(async (sessionId, notas) => {
  setUI({ saveStatus: "saving" });
  try {
    await updateSessao(sessionId, { notas });
    setUI({ saveStatus: "idle" });
  } catch (e) {
    console.error(e);
    setUI({ saveStatus: "error" });
  }
}, 900);

/* ---------------------------- Ações genéricas com tratamento de erro ---------------------------- */
async function runAction(promiseFn) {
  setUI({ saveStatus: "saving" });
  try {
    await promiseFn();
    state.ui.saveStatus = "idle";
    render();
  } catch (e) {
    console.error(e);
    setUI({ saveStatus: "error" });
  }
}

/* ---------------------------- Delegação de eventos ---------------------------- */
root.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    case "set-tab":
      state.tab = btn.dataset.value;
      state.ui.openSessionId = null;
      render();
      break;

    case "set-escalao":
      state.filtroEscalao = btn.dataset.value;
      render();
      break;

    case "open-sessao":
      state.ui.openSessionId = id;
      render();
      break;

    case "close-sessao":
      state.ui.openSessionId = null;
      state.ui.editingSessaoId = null;
      render();
      break;

    case "show-atleta-form":
      setUI({ showAtletaForm: true });
      break;
    case "cancel-atleta-form":
      setUI({ showAtletaForm: false });
      break;
    case "submit-atleta": {
      const nome = document.getElementById("form-atleta-nome").value.trim();
      const escalao = document.getElementById("form-atleta-escalao").value;
      const posicao = document.getElementById("form-atleta-posicao").value.trim();
      if (!nome) return;
      setUI({ showAtletaForm: false });
      await runAction(() => addAtleta({ nome, escalao, posicao }));
      break;
    }

    case "edit-atleta":
      setUI({ editingAtletaId: id });
      break;
    case "cancel-edit-atleta":
      setUI({ editingAtletaId: null });
      break;
    case "submit-edit-atleta": {
      const nome = document.getElementById("edit-atleta-nome").value.trim();
      const posicao = document.getElementById("edit-atleta-posicao").value.trim();
      if (!nome) return;
      setUI({ editingAtletaId: null });
      await runAction(() => updateAtleta(id, { nome, posicao }));
      break;
    }
    case "toggle-ativo-atleta": {
      const atleta = state.atletas.find((a) => a.id === id);
      await runAction(() => updateAtleta(id, { ativo: !atleta.ativo }));
      break;
    }
    case "remover-atleta": {
      const nome = btn.dataset.nome;
      if (!window.confirm(`Remover ${nome} da lista de atletas? Esta ação não pode ser desfeita.`)) return;
      await runAction(() => deleteAtleta(id));
      break;
    }

    case "show-sessao-form":
      setUI({ showSessaoForm: true });
      break;
    case "cancel-sessao-form":
      setUI({ showSessaoForm: false });
      break;
    case "submit-sessao": {
      const data = document.getElementById("form-sessao-data").value;
      const hora = document.getElementById("form-sessao-hora").value;
      const tipo = document.getElementById("form-sessao-tipo").value;
      const escalao = document.getElementById("form-sessao-escalao").value;
      if (!data) return;
      setUI({ showSessaoForm: false });
      await runAction(() => addSessao({ data, hora, tipo, escalao }));
      break;
    }

    case "edit-sessao":
      setUI({ editingSessaoId: id });
      break;
    case "cancel-edit-sessao":
      setUI({ editingSessaoId: null });
      break;
    case "submit-edit-sessao": {
      const data = document.getElementById("edit-sessao-data").value;
      const hora = document.getElementById("edit-sessao-hora").value;
      const tipo = document.getElementById("edit-sessao-tipo").value;
      if (!data) return;
      setUI({ editingSessaoId: null });
      await runAction(() => updateSessao(id, { data, hora, tipo }));
      break;
    }
    case "finalizar-sessao":
      await runAction(() => updateSessao(id, { estado: "concluida" }));
      break;
    case "reabrir-sessao":
      await runAction(() => updateSessao(id, { estado: "agendada" }));
      break;
    case "remover-sessao": {
      const resumo = btn.dataset.resumo;
      if (!window.confirm(`Remover a sessão "${resumo}"? Esta ação não pode ser desfeita.`)) return;
      state.ui.openSessionId = null;
      await runAction(() => deleteSessao(id));
      break;
    }
    case "marcar-presenca": {
      const sessao = state.sessoes.find((s) => s.id === id);
      const atletaId = btn.dataset.atleta;
      const estadoClicado = btn.dataset.estado;
      const atual = (sessao.presencas || {})[atletaId];
      const novoEstado = atual === estadoClicado ? null : estadoClicado;
      await runAction(() => updateSessaoPresenca(id, atletaId, novoEstado));
      break;
    }

    case "submit-aviso": {
      const autor = document.getElementById("form-aviso-autor").value.trim();
      const texto = document.getElementById("form-aviso-texto").value.trim();
      if (!texto) return;
      document.getElementById("form-aviso-texto").value = "";
      await runAction(() => addAviso({ autor, texto }));
      break;
    }
    case "remover-aviso":
      if (!window.confirm("Remover este aviso?")) return;
      await runAction(() => deleteAviso(id));
      break;

    case "retry-save":
      setUI({ saveStatus: "idle" });
      break;

    default:
      break;
  }
});

root.addEventListener(
  "blur",
  (e) => {
    const el = e.target;
    if (el && el.dataset && el.dataset.actionBlur === "guardar-notas") {
      debouncedSaveNotas(el.dataset.id, el.value);
    }
  },
  true
);

render();
