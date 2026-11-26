/* ============================================================
   PRO HAD — TABELA DE PREÇOS DAS INSCRIÇÕES (Etapa II)

   Este é o ÚNICO lugar do site onde ficam os valores.
   Os dois formulários (index.html e inscricoes.html) leem daqui.

   Hoje a planilha grava o valor calculado aqui no site
   (o Apps Script não recalcula). Se um dia o cálculo passar
   para o Apps Script, copie esta tabela para lá também.

   Como funciona cada lote:
   - ate: último dia do lote (inclusive), formato 'AAAA-MM-DD'.
          null = sem data final (vale até o fim das inscrições).
   - um:          preço de 1 inscrição
   - dois:        preço total de 2 inscrições
   - cadaAteSeis: preço de cada inscrição quando são de 3 a 6
   - cadaDaSetima: a partir da 7ª, TODAS as inscrições do pedido
                   passam a custar este valor (7 = 7 × valor)
   O lote vigente é o primeiro cuja data ainda não passou
   (horário de Brasília). Depois do último, vale o último.
============================================================ */
window.PROHAD_LOTES = [
  // Promoção do 1º lote (decidido em 23/11/2026): R$ 300 por inscrição, qualquer quantidade, até 12/12.
  { nome: 'Promoção 1º lote', ate: '2026-12-12', um: 300, dois: 600, cadaAteSeis: 300, cadaDaSetima: 300 },
  // 2º lote (decidido em 26/11/2026): regra da Etapa I, mas a partir da 7ª todas saem por R$ 300.
  // 1 = 400 · 2 = 750 · 3 = 999 · 4 = 1.332 · 5 = 1.665 · 6 = 1.998 · 7 = 2.100 · 8 = 2.400 · 9 = 2.700 …
  { nome: '2º lote', ate: null, um: 400, dois: 750, cadaAteSeis: 333, cadaDaSetima: 300 },
];

window.PROHAD_PRECO = (function () {
  function hoje() {
    // AAAA-MM-DD no fuso de Brasília
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  }
  function loteAtual() {
    const L = window.PROHAD_LOTES, h = hoje();
    return L.find(l => !l.ate || h <= l.ate) || L[L.length - 1];
  }
  function fmt(p) { return 'R$ ' + Number(p).toLocaleString('pt-BR'); }
  function fmtData(d) { const [, m, dia] = d.split('-'); return dia + '/' + m; }

  function total(n) {
    const l = loteAtual();
    if (n <= 0) return 0;
    if (n === 1) return l.um;
    if (n === 2) return l.dois;
    if (n <= 6) return n * l.cadaAteSeis;
    return n * l.cadaDaSetima;
  }

  function calculo(n) {
    if (n <= 0) return '';
    const l = loteAtual();
    let txt;
    if (n === 1) txt = '1 inscrição: ' + fmt(l.um);
    else if (n === 2) txt = '2 inscrições: ' + fmt(l.dois);
    else if (n <= 6) txt = `${n} inscrições × ${fmt(l.cadaAteSeis)} = ${fmt(total(n))}`;
    else txt = `${n} inscrições × ${fmt(l.cadaDaSetima)} = ${fmt(total(n))}`;
    // Só mostra o nome do lote quando existe mais de um
    if (window.PROHAD_LOTES.length > 1) txt = `${l.nome}${l.ate ? ' (até ' + fmtData(l.ate) + ')' : ''} · ` + txt;
    return txt;
  }

  // Preenche textos fixos da página que citam valores: <span data-preco="cadaDaSetima">
  function preencher() {
    const l = loteAtual();
    document.querySelectorAll('[data-preco]').forEach(el => {
      const v = l[el.dataset.preco];
      if (v != null) el.textContent = fmt(v);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preencher);
  else preencher();

  return { loteAtual, total, calculo, fmt };
})();
