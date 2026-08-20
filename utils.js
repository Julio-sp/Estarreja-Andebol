/**
 * ============================================================================
 * UTILITÁRIOS
 * ============================================================================
 */

export const ESCALOES = ["Sub-16", "Sub-18"];
export const TIPOS_SESSAO = ["Treino", "Jogo"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDatePT(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function weekdayPT(iso) {
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const d = new Date(iso + "T12:00:00");
  return dias[d.getDay()];
}

export function sortByNome(lista) {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-PT", { sensitivity: "base" }));
}

export function sessaoConcluida(s) {
  return s.estado === "concluida";
}

// Percentagem de presença de UMA sessão, em relação ao grupo de atletas alvo (já filtrado por escalão/ativas)
export function calcPresencaSessao(sessao, atletasAlvo) {
  if (!atletasAlvo || atletasAlvo.length === 0) return null;
  const presencas = sessao.presencas || {};
  const presentes = atletasAlvo.filter((a) => presencas[a.id] === "presente").length;
  return Math.round((presentes / atletasAlvo.length) * 100);
}

// Presença média ao longo de todas as sessões CONCLUÍDAS, dentro do(s) escalão(ões) visível(eis)
export function calcPresencaMedia(sessionsConcluidas, roster) {
  if (sessionsConcluidas.length === 0) return null;
  const percentagens = sessionsConcluidas
    .map((s) => {
      const atletasAlvo = roster.filter((a) => a.escalao === s.escalao && a.ativo);
      return calcPresencaSessao(s, atletasAlvo);
    })
    .filter((p) => p !== null);
  if (percentagens.length === 0) return null;
  const soma = percentagens.reduce((acc, p) => acc + p, 0);
  return Math.round(soma / percentagens.length);
}

// Percentagem de presença de UMA atleta, ao longo de todas as sessões concluídas do seu escalão
export function calcPresencaAtleta(atleta, sessions) {
  const sessoesDoEscalao = sessions.filter((s) => s.escalao === atleta.escalao && sessaoConcluida(s));
  if (sessoesDoEscalao.length === 0) return null;
  const presencas = sessoesDoEscalao.filter((s) => (s.presencas || {})[atleta.id] === "presente").length;
  return Math.round((presencas / sessoesDoEscalao.length) * 100);
}

export function debounce(fn, delay) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.flushNow = (...args) => {
    if (timer) clearTimeout(timer);
    timer = null;
    fn(...args);
  };
  return debounced;
}
