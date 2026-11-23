/* ============================================================
   PRO HAD — TABELA DE PREÇOS DAS INSCRIÇÕES (Etapa II)

   Este é o ÚNICO lugar do site onde ficam os valores.
   Os dois formulários (index.html e inscricoes.html) leem daqui.

   IMPORTANTE: a mesma tabela existe no Apps Script da planilha
   (constante LOTES em apps-script-inscricoes.gs). O valor gravado
   na planilha é o calculado lá. Ao mudar aqui, mude lá também.

   Como funciona cada lote:
   - ate: último dia do lote (inclusive), formato 'AAAA-MM-DD'.
          null = sem data final (vale até o fim das inscrições).
   - um:          preço de 1 inscrição
   - dois:        preço total de 2 inscrições
   - cadaAteSeis: preço de cada inscrição quando são de 3 a 6
   - cadaExtra:   preço de cada inscrição a partir da 7ª
   O lote vigente é o primeiro cuja data ainda não passou
   (horário de Brasília). Depois do último, vale o último.
============================================================ */
window.PROHAD_LOTES = [
  // Promoção do 1º lote (decidido em 23/11/2026): R$ 300 por inscrição, qualquer quantidade, até 12/12.
  { nome: 'Promoção 1º lote', ate: '2026-12-12', um: 300, dois: 600, cadaAteSeis: 300, cadaExtra: 300 },
  // 2º lote: tabela por quantidade da Etapa I (A CONFIRMAR com o cliente).
  { nome: '2º lote', ate: null, um: 400, dois: 750, cadaAteSeis: 333, cadaExtra: 300 },
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
    return 6 * l.cadaAteSeis + (n - 6) * l.cadaExtra;
  }

  function calculo(n) {
    if (n <= 0) return '';
    const l = loteAtual();
    let txt;
    const precoUnico = l.dois === 2 * l.um && l.cadaAteSeis === l.um && l.cadaExtra === l.um;
    if (precoUnico) txt = n === 1 ? '1 inscrição: ' + fmt(l.um) : `${n} inscrições × ${fmt(l.um)} = ${fmt(n * l.um)}`;
    else if (n === 1) txt = '1 inscrição: ' + fmt(l.um);
    else if (n === 2) txt = '2 inscrições: ' + fmt(l.dois);
    else if (n <= 6) txt = `${n} inscrições × ${fmt(l.cadaAteSeis)} = ${fmt(n * l.cadaAteSeis)}`;
    else {
      const ex = n - 6;
      txt = `6 inscrições = ${fmt(6 * l.cadaAteSeis)} + ${ex} inscrição${ex > 1 ? 'ões' : ''} extra${ex > 1 ? 's' : ''} × ${fmt(l.cadaExtra)} = ${fmt(total(n))}`;
    }
    // Só mostra o nome do lote quando existe mais de um
    if (window.PROHAD_LOTES.length > 1) txt = `${l.nome}${l.ate ? ' (até ' + fmtData(l.ate) + ')' : ''} · ` + txt;
    return txt;
  }

  // Preenche textos fixos da página que citam valores: <span data-preco="cadaExtra">
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
