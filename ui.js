/**
 * ============================================================================
 * INTERFACE — funções de renderização (HTML como strings + Tailwind-like utilitários)
 * ============================================================================
 * Nota de arquitetura: os campos de formulário NÃO são "controlados" (ao
 * contrário de React) — o valor só é lido do DOM no momento em que se clica
 * em "Guardar". Isto evita voltar a desenhar o ecrã a cada letra digitada,
 * o que faria perder o foco do campo de texto.
 * ============================================================================
 */
import { icons } from "./icons.js";
import {
  ESCALOES,
  TIPOS_SESSAO,
  todayISO,
  formatDatePT,
  weekdayPT,
  sortByNome,
  sessaoConcluida,
  calcPresencaSessao,
  calcPresencaMedia,
  calcPresencaAtleta,
} from "./utils.js";

function pill(text, tone = "green") {
  const tones = {
    green: "background:#EAF5EE;color:#2E6B49",
    gold: "background:#FDF3DC;color:#8A6A11",
    red: "background:#FBE9E7;color:#C0392B",
    grey: "background:#F0F0EE;color:#6B6B6B",
  };
  return `<span class="pill" style="${tones[tone]}">${text}</span>`;
}

function emptyState(icon, text) {
  return `<div class="empty-state">${icons[icon](32, 1.5)}<p>${text}</p></div>`;
}

function segmented(name, options, value) {
  return `<div class="segmented" data-segmented="${name}">${options
    .map(
      (opt) =>
        `<button type="button" class="seg-btn ${opt === value ? "on" : ""}" data-action="set-${name}" data-value="${opt}">${opt}</button>`
    )
    .join("")}</div>`;
}

/* ============================================================================
   PAINEL
   ============================================================================ */
export function renderPainel(state) {
  const { atletas, sessoes, filtroEscalao } = state;
  const escaloesVisiveis = filtroEscalao === "Todos" ? ESCALOES : [filtroEscalao];
  const rosterFiltrado = atletas.filter((a) => escaloesVisiveis.includes(a.escalao));
  const sessionsFiltradas = sessoes.filter((s) => escaloesVisiveis.includes(s.escalao));

  const totalAtivos = rosterFiltrado.filter((a) => a.ativo).length;
  const sessoesConcluidasArr = sessionsFiltradas.filter(sessaoConcluida);
  const presencaMedia = calcPresencaMedia(sessoesConcluidasArr, atletas);

  const proximaSessao = sessionsFiltradas
    .filter((s) => !sessaoConcluida(s) && s.data >= todayISO())
    .sort((a, b) => (a.data > b.data ? 1 : -1))[0];

  const ultimasConcluidas = [...sessoesConcluidasArr].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 3);

  return `
    <div class="pt-1">
      <div class="grid-2 mb-3">
        <div class="card"><p class="muted">Atletas ativas</p><p class="kpi">${totalAtivos}</p></div>
        <div class="card"><p class="muted">Sessões concluídas</p><p class="kpi">${sessoesConcluidasArr.length}</p></div>
      </div>

      <div class="card-dark mb-4">
        <p class="muted-light">Presença média (sessões concluídas)</p>
        <p class="kpi-gold">${presencaMedia === null ? "—" : presencaMedia + "%"}</p>
        ${presencaMedia === null ? '<p class="muted-light small">Finaliza uma sessão para começar a ver este valor.</p>' : ""}
      </div>

      <p class="section-label">Próxima sessão</p>
      ${
        proximaSessao
          ? `<button type="button" class="list-row-card mb-4" data-action="open-sessao" data-id="${proximaSessao.id}">
              <div>
                <p class="row-title">${proximaSessao.tipo} · ${proximaSessao.escalao}</p>
                <p class="row-sub">${weekdayPT(proximaSessao.data)}, ${formatDatePT(proximaSessao.data)}${proximaSessao.hora ? " às " + proximaSessao.hora : ""}</p>
              </div>
              ${icons.chevronRight(18)}
            </button>`
          : `<div class="card mb-4 text-center"><p class="muted">Sem sessões futuras agendadas.</p></div>`
      }

      <p class="section-label">Presenças recentes (sessões concluídas)</p>
      ${
        ultimasConcluidas.length === 0
          ? `<div class="card mb-4 text-center"><p class="muted">Ainda sem sessões concluídas.</p></div>`
          : `<div class="list-card mb-4">${ultimasConcluidas
              .map((s) => {
                const alvo = atletas.filter((a) => a.escalao === s.escalao && a.ativo);
                const taxa = calcPresencaSessao(s, alvo);
                const tone = taxa === null ? "grey" : taxa >= 75 ? "green" : taxa >= 50 ? "gold" : "red";
                return `<button type="button" class="list-row" data-action="open-sessao" data-id="${s.id}">
                  <div>
                    <p class="row-title-sm">${s.tipo} · ${s.escalao}</p>
                    <p class="row-sub-xs">${formatDatePT(s.data)}</p>
                  </div>
                  ${taxa !== null ? pill(taxa + "% presença", tone) : ""}
                </button>`;
              })
              .join("")}</div>`
      }

      <p class="section-label">Últimos avisos</p>
      ${
        state.avisos.length === 0
          ? `<div class="card text-center"><p class="muted">Sem avisos por agora.</p></div>`
          : `<div class="list-card">${state.avisos
              .slice(0, 2)
              .map((a) => `<div class="list-row-static"><p class="row-text">${escapeHTML(a.texto)}</p><p class="row-sub-xs">${escapeHTML(a.autor)} · ${formatDatePT(a.data)}</p></div>`)
              .join("")}</div>`
      }
    </div>
  `;
}

/* ============================================================================
   ATLETAS
   ============================================================================ */
export function renderAtletas(state) {
  const { atletas, sessoes, filtroEscalao, ui } = state;
  const escaloesVisiveis = filtroEscalao === "Todos" ? ESCALOES : [filtroEscalao];
  const rosterFiltrado = atletas.filter((a) => escaloesVisiveis.includes(a.escalao));
  const grupos = ESCALOES.filter((e) => filtroEscalao === "Todos" || filtroEscalao === e);

  const formHTML = ui.showAtletaForm
    ? `<div class="card mb-4">
        <input id="form-atleta-nome" type="text" placeholder="Nome completo" class="input mb-2" />
        <div class="flex-row mb-2">
          <select id="form-atleta-escalao" class="input flex-1">
            ${ESCALOES.map((e) => `<option value="${e}" ${e === (filtroEscalao !== "Todos" ? filtroEscalao : "Sub-16") ? "selected" : ""}>${e}</option>`).join("")}
          </select>
          <input id="form-atleta-posicao" type="text" placeholder="Posição (opcional)" class="input flex-1" />
        </div>
        <div class="flex-row">
          <button type="button" class="btn-primary flex-1" data-action="submit-atleta">Guardar</button>
          <button type="button" class="btn-secondary flex-1" data-action="cancel-atleta-form">Cancelar</button>
        </div>
      </div>`
    : `<button type="button" class="btn-primary btn-block mb-4" data-action="show-atleta-form">${icons.plus(16)} Nova atleta</button>`;

  if (rosterFiltrado.length === 0 && !ui.showAtletaForm) {
    return `<div class="pt-1">${formHTML}${emptyState("users", "Ainda não há atletas registadas.")}</div>`;
  }

  const grupoHTML = grupos
    .map((esc) => {
      const atletasGrupo = sortByNome(rosterFiltrado.filter((a) => a.escalao === esc));
      if (atletasGrupo.length === 0) return "";
      return `
        <div class="mb-4">
          <p class="section-label">${esc} (${atletasGrupo.length})</p>
          <div class="list-card">
            ${atletasGrupo
              .map((a) => {
                if (ui.editingAtletaId === a.id) {
                  return `<div class="list-row-static">
                    <input id="edit-atleta-nome" type="text" value="${escapeAttr(a.nome)}" class="input mb-2" />
                    <input id="edit-atleta-posicao" type="text" value="${escapeAttr(a.posicao || "")}" placeholder="Posição (opcional)" class="input mb-2" />
                    <div class="flex-row">
                      <button type="button" class="btn-primary flex-1 btn-sm" data-action="submit-edit-atleta" data-id="${a.id}">Guardar</button>
                      <button type="button" class="btn-secondary flex-1 btn-sm" data-action="cancel-edit-atleta">Cancelar</button>
                    </div>
                  </div>`;
                }
                const pct = calcPresencaAtleta(a, sessoes);
                return `<div class="list-row">
                  <button type="button" class="row-clickable" data-action="edit-atleta" data-id="${a.id}">
                    <p class="row-title-sm">${escapeHTML(a.nome)}</p>
                    <p class="row-sub-xs">${a.posicao ? escapeHTML(a.posicao) + " · " : ""}${pct === null ? "Sem sessões concluídas" : pct + "% de presença"}</p>
                  </button>
                  <div class="flex-row-tight">
                    <button type="button" data-action="toggle-ativo-atleta" data-id="${a.id}">${pill(a.ativo ? "Ativa" : "Inativa", a.ativo ? "green" : "grey")}</button>
                    <button type="button" class="icon-btn" data-action="remover-atleta" data-id="${a.id}" data-nome="${escapeAttr(a.nome)}">${icons.trash(15)}</button>
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        </div>`;
    })
    .join("");

  return `<div class="pt-1">${formHTML}${grupoHTML}</div>`;
}

/* ============================================================================
   SESSÕES
   ============================================================================ */
export function renderSessoes(state) {
  const { atletas, sessoes, filtroEscalao, ui } = state;

  if (ui.openSessionId) {
    const sessao = sessoes.find((s) => s.id === ui.openSessionId);
    if (sessao) return renderSessaoDetalhe(state, sessao);
  }

  const escaloesVisiveis = filtroEscalao === "Todos" ? ESCALOES : [filtroEscalao];
  const sessionsFiltradas = sessoes.filter((s) => escaloesVisiveis.includes(s.escalao));
  const proximas = sessionsFiltradas.filter((s) => !sessaoConcluida(s)).sort((a, b) => (a.data > b.data ? 1 : -1));
  const concluidas = sessionsFiltradas.filter(sessaoConcluida).sort((a, b) => (a.data < b.data ? 1 : -1));

  const formHTML = ui.showSessaoForm
    ? `<div class="card mb-4">
        <div class="flex-row mb-2">
          <input id="form-sessao-data" type="date" value="${todayISO()}" class="input flex-1" />
          <input id="form-sessao-hora" type="time" class="input" style="width:96px" />
        </div>
        <div class="flex-row mb-2">
          <select id="form-sessao-tipo" class="input flex-1">
            ${TIPOS_SESSAO.map((t) => `<option value="${t}">${t}</option>`).join("")}
          </select>
          <select id="form-sessao-escalao" class="input flex-1">
            ${ESCALOES.map((e) => `<option value="${e}" ${e === (filtroEscalao !== "Todos" ? filtroEscalao : "Sub-16") ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <div class="flex-row">
          <button type="button" class="btn-primary flex-1" data-action="submit-sessao">Criar sessão</button>
          <button type="button" class="btn-secondary flex-1" data-action="cancel-sessao-form">Cancelar</button>
        </div>
      </div>`
    : `<button type="button" class="btn-primary btn-block mb-4" data-action="show-sessao-form">${icons.plus(16)} Nova sessão</button>`;

  if (sessionsFiltradas.length === 0 && !ui.showSessaoForm) {
    return `<div class="pt-1">${formHTML}${emptyState("calendar", "Ainda não há sessões registadas.")}</div>`;
  }

  const proximasHTML =
    proximas.length > 0
      ? `<div class="mb-4"><p class="section-label">Próximas</p><div class="list-card">
        ${proximas
          .map(
            (s) => `<button type="button" class="list-row" data-action="open-sessao" data-id="${s.id}">
              <div><p class="row-title-sm">${s.tipo} · ${s.escalao}</p><p class="row-sub-xs">${weekdayPT(s.data)}, ${formatDatePT(s.data)}${s.hora ? " às " + s.hora : ""}</p></div>
              ${icons.chevronRight(16)}
            </button>`
          )
          .join("")}
      </div></div>`
      : "";

  const concluidasHTML =
    concluidas.length > 0
      ? `<div class="mb-4"><p class="section-label">Concluídas</p><div class="list-card">
        ${concluidas
          .map(
            (s) => `<button type="button" class="list-row" data-action="open-sessao" data-id="${s.id}">
              <div><p class="row-title-sm">${s.tipo} · ${s.escalao}</p><p class="row-sub-xs">${formatDatePT(s.data)}${s.hora ? " às " + s.hora : ""}</p></div>
              ${pill("Concluída", "green")}
            </button>`
          )
          .join("")}
      </div></div>`
      : "";

  return `<div class="pt-1">${formHTML}${proximasHTML}${concluidasHTML}</div>`;
}

function renderSessaoDetalhe(state, sessao) {
  const { atletas, ui } = state;
  const atletasGrupo = sortByNome(atletas.filter((a) => a.escalao === sessao.escalao && a.ativo));
  const concluida = sessaoConcluida(sessao);
  const presentesCount = atletasGrupo.filter((a) => (sessao.presencas || {})[a.id] === "presente").length;

  const editHTML = ui.editingSessaoId === sessao.id
    ? `<div class="card mb-3">
        <div class="flex-row mb-2">
          <input id="edit-sessao-data" type="date" value="${sessao.data}" class="input flex-1" />
          <input id="edit-sessao-hora" type="time" value="${sessao.hora || ""}" class="input" style="width:96px" />
        </div>
        <select id="edit-sessao-tipo" class="input mb-2">
          ${TIPOS_SESSAO.map((t) => `<option value="${t}" ${t === sessao.tipo ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <div class="flex-row">
          <button type="button" class="btn-primary flex-1" data-action="submit-edit-sessao" data-id="${sessao.id}">Guardar</button>
          <button type="button" class="btn-secondary flex-1" data-action="cancel-edit-sessao">Cancelar</button>
        </div>
      </div>`
    : `<div class="card mb-3">
        <div class="flex-between mb-1">
          <div class="flex-row-tight"><p class="row-title">${sessao.tipo} · ${sessao.escalao}</p>${concluida ? pill("Concluída", "green") : ""}</div>
          <div class="flex-row-tight">
            <button type="button" class="link-btn" data-action="edit-sessao" data-id="${sessao.id}">Editar</button>
            <button type="button" class="icon-btn" data-action="remover-sessao" data-id="${sessao.id}" data-resumo="${escapeAttr(sessao.tipo + " · " + formatDatePT(sessao.data))}">${icons.trash(15)}</button>
          </div>
        </div>
        <p class="row-sub flex-row-tight">${icons.clock(12)} ${weekdayPT(sessao.data)}, ${formatDatePT(sessao.data)}${sessao.hora ? " às " + sessao.hora : ""}</p>
      </div>`;

  const presencasHTML =
    atletasGrupo.length === 0
      ? emptyState("users", "Sem atletas ativas neste escalão.")
      : `<div class="list-card mb-4">${atletasGrupo
          .map((a) => {
            const estadoAtual = (sessao.presencas || {})[a.id];
            return `<div class="list-row">
              <p class="row-text">${escapeHTML(a.nome)}</p>
              <div class="flex-row-tight">
                <button type="button" class="marker ${estadoAtual === "presente" ? "marker-green" : ""}" data-action="marcar-presenca" data-id="${sessao.id}" data-atleta="${a.id}" data-estado="presente" title="Presente">${icons.check(14)}</button>
                <button type="button" class="marker marker-letter ${estadoAtual === "justificado" ? "marker-gold" : ""}" data-action="marcar-presenca" data-id="${sessao.id}" data-atleta="${a.id}" data-estado="justificado" title="Falta justificada">J</button>
                <button type="button" class="marker ${estadoAtual === "ausente" ? "marker-red" : ""}" data-action="marcar-presenca" data-id="${sessao.id}" data-atleta="${a.id}" data-estado="ausente" title="Ausente">${icons.x(14)}</button>
              </div>
            </div>`;
          })
          .join("")}</div>`;

  return `
    <div class="pt-1">
      <button type="button" class="back-link" data-action="close-sessao">${icons.chevronLeft(15)} Voltar às sessões</button>
      ${editHTML}
      ${
        concluida
          ? `<button type="button" class="btn-secondary btn-block mb-4" data-action="reabrir-sessao" data-id="${sessao.id}">Reabrir para editar</button>`
          : `<button type="button" class="btn-primary btn-block mb-4" data-action="finalizar-sessao" data-id="${sessao.id}">Finalizar sessão</button>`
      }
      <p class="section-label">Presenças (${presentesCount}/${atletasGrupo.length})</p>
      ${presencasHTML}
      <p class="section-label">Notas / plano de treino</p>
      <textarea id="sessao-notas" class="textarea" rows="4" placeholder="Exercícios, objetivos da sessão, observações..." data-action-blur="guardar-notas" data-id="${sessao.id}">${escapeHTML(sessao.notas || "")}</textarea>
    </div>
  `;
}

/* ============================================================================
   AVISOS
   ============================================================================ */
export function renderAvisos(state) {
  const { avisos } = state;
  return `
    <div class="pt-1">
      <div class="card mb-4">
        <input id="form-aviso-autor" type="text" placeholder="O teu nome" class="input mb-2" />
        <textarea id="form-aviso-texto" class="textarea mb-2" rows="3" placeholder="Escreve um aviso para a equipa técnica..."></textarea>
        <button type="button" class="btn-primary btn-block" data-action="submit-aviso">Publicar aviso</button>
      </div>
      ${
        avisos.length === 0
          ? emptyState("message", "Ainda não há avisos.")
          : `<div class="list-card">${avisos
              .map(
                (a) => `<div class="list-row">
                  <div><p class="row-text">${escapeHTML(a.texto)}</p><p class="row-sub-xs mt1">${escapeHTML(a.autor)} · ${formatDatePT(a.data)}</p></div>
                  <button type="button" class="icon-btn" data-action="remover-aviso" data-id="${a.id}">${icons.trash(14)}</button>
                </div>`
              )
              .join("")}</div>`
      }
    </div>
  `;
}

/* ============================================================================
   SHELL (cabeçalho, filtro, navegação)
   ============================================================================ */
export function renderShell(state, contentHTML) {
  const { ui } = state;
  const statusHTML = ui.saveStatus === "error"
    ? `<div class="banner banner-error"><span>Não foi possível gravar tudo. Verifica a ligação à internet.</span><button type="button" class="link-btn-strong" data-action="retry-save">Tentar de novo</button></div>`
    : ui.saveStatus === "saving"
    ? `<div class="banner banner-info">${icons.loader(12)} A gravar...</div>`
    : "";

  return `
    <div class="app-shell">
      <div class="app-header">
        <img src="assets/img/emblema-eac.png" alt="Emblema EAC" class="crest" />
        <div class="flex-1">
          <p class="app-title">EAC · Apoio ao Treino</p>
          <p class="app-subtitle">Sub-16 &amp; Sub-18 Feminino</p>
        </div>
      </div>
      <div class="filter-row">${segmented("escalao", ["Todos", "Sub-16", "Sub-18"], state.filtroEscalao)}</div>
      ${statusHTML}
      <div class="app-content">${contentHTML}</div>
      <div class="bottom-nav">
        ${navBtn("home", "Painel", "painel", state.tab)}
        ${navBtn("users", "Atletas", "atletas", state.tab)}
        ${navBtn("calendar", "Sessões", "sessoes", state.tab)}
        ${navBtn("message", "Avisos", "avisos", state.tab)}
      </div>
      <p class="footer-note">Dados sincronizados em tempo real com a equipa técnica</p>
    </div>
  `;
}

function navBtn(icon, label, tabName, activeTab) {
  const active = tabName === activeTab;
  return `<button type="button" class="nav-btn ${active ? "active" : ""}" data-action="set-tab" data-value="${tabName}">
    ${icons[icon](20, active ? 2.4 : 1.8)}
    <span>${label}</span>
  </button>`;
}

/* ---------------------------- helpers ---------------------------- */
function escapeHTML(str) {
  return (str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) {
  return escapeHTML(str);
}
