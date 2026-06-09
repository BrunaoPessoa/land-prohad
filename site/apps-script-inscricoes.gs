/**
 * CIRCUITO PRO HAD 2026 — Sistema de Inscrições v2
 * Google Apps Script — Web App Endpoint
 *
 * ══════════════════════════════════════════════════════════
 * COMO REIMPLANTAR (necessário após esta atualização):
 *
 * 1. Abra a planilha:
 *    https://docs.google.com/spreadsheets/d/1ntPADsBez5JRGulTuEnMmM37wynpEty4XhJmCupJ5vI/
 *
 * 2. No menu: Extensões → Apps Script
 *
 * 3. Apague TODO o código e cole este arquivo
 *
 * 4. Salve com Ctrl+S
 *
 * 5. Clique em "Implantar" → "NOVA implantação" (não editar a existente)
 *    - Tipo: Aplicativo da Web
 *    - Executar como: Eu (seu email)
 *    - Quem pode acessar: Qualquer pessoa
 *    - Clique em "Implantar" e autorize
 *
 * 6. Copie a nova URL gerada
 *
 * 7. Abra inscricoes.html e atualize SCRIPT_URL com a nova URL
 *
 * ESTRUTURA DA PLANILHA (v2):
 * 1 linha por conjunto inscrito.
 * Todos os conjuntos do mesmo envio compartilham o mesmo ID_REGISTRO.
 * ══════════════════════════════════════════════════════════
 */

const ABA_INSCRICOES = 'Inscrições';

const CAT_LABELS = {
  amadorFoot:  'AMADOR ONE FOOT',
  amadorHorse: 'AMADOR HORSEBACK',
  proFoot:     'PRO ONE FOOT',
  proHorse:    'PRO HORSEBACK'
};

// ── Endpoint principal — recebe dados do formulário ─────────
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    // Validação de campos raiz
    const obrigatorios = {
      nome:     'Nome do competidor',
      camisa:   'Tamanho da camisa',
      whatsapp: 'WhatsApp',
      cidade:   'Cidade',
      estado:   'Estado'
    };

    const faltando = Object.entries(obrigatorios)
      .filter(([chave]) => !dados[chave] || String(dados[chave]).trim() === '')
      .map(([, rotulo]) => rotulo);

    if (faltando.length > 0) {
      return jsonResponse(false, null, 'Campos obrigatórios não preenchidos: ' + faltando.join(', '));
    }

    // Validação dos conjuntos
    if (!dados.conjuntos || !Array.isArray(dados.conjuntos) || dados.conjuntos.length === 0) {
      return jsonResponse(false, null, 'Adicione pelo menos um conjunto.');
    }

    for (var i = 0; i < dados.conjuntos.length; i++) {
      var c = dados.conjuntos[i];
      if (!c.nomeCao || String(c.nomeCao).trim() === '') {
        return jsonResponse(false, null, 'Conjunto ' + (i+1) + ': informe o nome do cão.');
      }
      if (!c.sexo) {
        return jsonResponse(false, null, 'Conjunto ' + (i+1) + ': selecione o sexo.');
      }
    }

    const aba   = obterOuCriarAba();
    const id    = gerarId();
    const agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    const total = dados.conjuntos.length;

    // Uma linha por conjunto
    dados.conjuntos.forEach(function(c, i) {
      aba.appendRow([
        id,
        (i + 1) + ' de ' + total,
        agora,
        'AGUARDANDO PAGAMENTO',
        dados.tipoCompetidor ? dados.tipoCompetidor.toUpperCase() : '',
        dados.nome,
        dados.whatsapp,
        dados.cidade,
        dados.estado,
        dados.camisa,
        c.nomeCao,
        c.sexo,
        Number(c.amadorFoot)    || 0,
        Number(c.amadorHorse)   || 0,
        Number(c.proFoot)       || 0,
        Number(c.proHorse)      || 0,
        Number(c.totalConjunto) || 0,
        'R$ ' + Number(dados.valorTotal).toLocaleString('pt-BR'),
        dados.etapa || 'Etapa 1',
        '',
        agora,
        ''
      ]);
    });

    return jsonResponse(true, { id: id, timestamp: agora, conjuntos: total }, null);

  } catch (err) {
    return jsonResponse(false, null, 'Erro interno: ' + err.message);
  }
}

// ── Endpoint de teste ────────────────────────────────────────
function doGet(e) {
  return jsonResponse(true, { status: 'Pro Had API online v2', versao: '2.0' }, null);
}

// ── Gera ID único com trava (sem colisão) ────────────────────
function gerarId() {
  const trava = LockService.getScriptLock();
  trava.waitLock(15000);
  try {
    const props   = PropertiesService.getScriptProperties();
    const atual   = parseInt(props.getProperty('ultimoId') || '0');
    const proximo = atual + 1;
    props.setProperty('ultimoId', String(proximo));
    return 'PROHAD-2026-' + String(proximo).padStart(5, '0');
  } finally {
    trava.releaseLock();
  }
}

// ── Cria a aba se não existir e formata o cabeçalho ─────────
function obterOuCriarAba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba  = ss.getSheetByName(ABA_INSCRICOES);

  if (!aba) {
    aba = ss.insertSheet(ABA_INSCRICOES);
  }

  if (aba.getLastRow() === 0) {
    const cabecalhos = [
      'ID_REGISTRO',
      'NUM_CONJUNTO',
      'DATA_CADASTRO',
      'STATUS',
      'TIPO_COMPETIDOR',
      'NOME_COMPETIDOR',
      'WHATSAPP',
      'CIDADE',
      'ESTADO',
      'CAMISA',
      'NOME_CAO',
      'SEXO_CAO',
      'AMADOR_ONE_FOOT',
      'AMADOR_HORSEBACK',
      'PRO_ONE_FOOT',
      'PRO_HORSEBACK',
      'TOTAL_CONJUNTO',
      'VALOR_TOTAL',
      'ETAPA',
      'OBSERVACOES',
      'ULTIMA_ATUALIZACAO',
      'RESPONSAVEL'
    ];

    aba.appendRow(cabecalhos);

    // Formatação: fundo vermelho Pro Had, texto branco, negrito
    const cabRange = aba.getRange(1, 1, 1, cabecalhos.length);
    cabRange.setBackground('#994434');
    cabRange.setFontColor('#FFFFFF');
    cabRange.setFontWeight('bold');
    cabRange.setFontSize(10);
    aba.setFrozenRows(1);

    // Larguras das colunas (22 colunas)
    const larguras = [
      160, // ID_REGISTRO
       90, // NUM_CONJUNTO
      160, // DATA_CADASTRO
      190, // STATUS
      150, // TIPO_COMPETIDOR
      200, // NOME_COMPETIDOR
      150, // WHATSAPP
      140, // CIDADE
       80, // ESTADO
       80, // CAMISA
      140, // NOME_CAO
       90, // SEXO_CAO
      140, // AMADOR_ONE_FOOT
      150, // AMADOR_HORSEBACK
      130, // PRO_ONE_FOOT
      140, // PRO_HORSEBACK
      130, // TOTAL_CONJUNTO
      120, // VALOR_TOTAL
       80, // ETAPA
      200, // OBSERVACOES
      160, // ULTIMA_ATUALIZACAO
      140  // RESPONSAVEL
    ];
    larguras.forEach(function(l, i) { aba.setColumnWidth(i + 1, l); });
  }

  return aba;
}

// ── Helper: monta resposta JSON ─────────────────────────────
function jsonResponse(success, data, error) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, data: data, error: error }))
    .setMimeType(ContentService.MimeType.JSON);
}
