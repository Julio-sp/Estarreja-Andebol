/**
 * ============================================================================
 * ÍCONES (SVG embutido, sem dependências externas)
 * ============================================================================
 * Cada função devolve uma string HTML de um <svg>. Usar sempre com
 * elemento.innerHTML = icon(...) ou dentro de template strings.
 * ============================================================================
 */

function svg(paths, size = 20, strokeWidth = 1.8) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export const icons = {
  home: (s, sw) => svg('<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>', s, sw),
  users: (s, sw) => svg('<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 6.2a3.2 3.2 0 0 1 0 6.2"/><path d="M15 14c2.8.4 5 2.6 5 6"/>', s, sw),
  calendar: (s, sw) => svg('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>', s, sw),
  message: (s, sw) => svg('<path d="M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H5.5a2 2 0 0 1-2-2v-9Z"/>', s, sw),
  plus: (s, sw) => svg('<path d="M12 5v14M5 12h14"/>', s, sw),
  check: (s, sw) => svg('<path d="M20 6 9 17l-5-5"/>', s, sw),
  x: (s, sw) => svg('<path d="M18 6 6 18M6 6l12 12"/>', s, sw),
  clock: (s, sw) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', s, sw),
  chevronRight: (s, sw) => svg('<path d="m9 6 6 6-6 6"/>', s, sw),
  chevronLeft: (s, sw) => svg('<path d="m15 6-6 6 6 6"/>', s, sw),
  trash: (s, sw) => svg('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/>', s, sw),
  loader: (s, sw) => svg('<path d="M12 3a9 9 0 1 0 9 9"/>', s, sw),
  edit: (s, sw) => svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', s, sw),
};
