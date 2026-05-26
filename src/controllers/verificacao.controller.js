/**
 * Controller para verificação de notícias.
 * Endpoint: POST /api/verificar
 * 
 * Processa:
 * 1. Análise de IA (toxicidade, padrões de desinformação)
 * 2. Busca em fact-checking databases (Google Fact Check API)
 * 3. Análise de fontes e credibilidade
 */

const axios = require('axios');

/**
 * Analyze toxicity using TensorFlow (mock para dev)
 */
async function analyzeToxicity(text) {
  try {
    // Em produção, usaria TensorFlow.js com @tensorflow-models/toxicity
    // Para dev, retorna análise básica
    
    const suspiciousPatterns = [
      /(?:compartilhe|urgente|não deixe ninguém saber)/gi,
      /(?:golpe|bomba|explosão|fake)/gi,
      /(?:mata|morre|doença|epidemia)/gi,
      /(?:conspiração|illuminati|novo governo mundial)/gi,
    ];

    let riskScore = 0.3; // base score
    
    suspiciousPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        riskScore += 0.15 * matches.length;
      }
    });

    // Text credibility: longer texts are typically more credible
    const textLength = text.split(' ').length;
    if (textLength > 100) riskScore -= 0.1;
    if (textLength > 300) riskScore -= 0.1;
    if (textLength < 10) riskScore += 0.2;

    riskScore = Math.max(0, Math.min(1, riskScore)); // Clamp 0-1
    const truthPercentage = Math.round((1 - riskScore) * 100);

    return {
      porcentagemVerdade: truthPercentage,
      riskScore,
      detalhes: [
        {
          aspect: 'Suspição de padrões',
          probability: Math.round((1 - riskScore) * 100),
        },
        {
          aspect: 'Coerência textual',
          probability: 60 + Math.random() * 20,
        },
        {
          aspect: 'Fontes potenciais',
          probability: 50 + Math.random() * 30,
        },
      ],
    };
  } catch (err) {
    console.error('Erro ao analisar toxicidade:', err.message);
    return {
      porcentagemVerdade: 50,
      detalhes: [
        { aspect: 'Análise indisponível', probability: 50 },
      ],
    };
  }
}

/**
 * Query Google Fact Check API
 */
async function getFactChecks(query, GOOGLE_API_KEY) {
  try {
    if (!GOOGLE_API_KEY) {
      console.warn('⚠️ GOOGLE_API_KEY não configurado, fact-checking desabilitado');
      return [];
    }

    const url = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
    const response = await axios.get(url, {
      params: {
        query: query.substring(0, 500),
        pageSize: 5,
        key: GOOGLE_API_KEY,
      },
      timeout: 5000,
    });

    if (!response.data.claims) return [];

    return response.data.claims.map(claim => ({
      alegacao: claim.text || claim.claimReview?.[0]?.title || 'Sem descrição',
      avaliacao: claim.claimReview?.[0]?.textualRating || 'Não verificado',
      verificador: claim.claimReview?.[0]?.publisher?.name || 'Fonte desconhecida',
      autor: claim.claimReview?.[0]?.author?.name || 'Autor não informado',
      url_revisao: claim.claimReview?.[0]?.url || null,
      data: claim.claimReview?.[0]?.reviewDate || null,
    }));
  } catch (err) {
    console.error('Erro ao buscar fact-checks:', err.message);
    return [];
  }
}

/**
 * Extract title and content from URL or text
 */
async function extractContent(texto, url, modo) {
  try {
    if (modo === 'link' && url) {
      // Para URLs, tenta buscar conteúdo (mock)
      const titulo = `Análise da URL: ${new URL(url).hostname}`;
      const conteudo = `Conteúdo extraído de: ${url}\n\nNota: Análise detalhada requer scraped do site.`;
      
      return { titulo, conteudo };
    }

    // Para texto, usa os primeiros caracteres como título
    const lines = texto.split('\n').filter(l => l.trim());
    const titulo = lines[0]?.substring(0, 100) || 'Análise de texto';
    const conteudo = texto.substring(0, 500);

    return { titulo, conteudo };
  } catch (err) {
    console.error('Erro ao extrair conteúdo:', err.message);
    return {
      titulo: 'Conteúdo',
      conteudo: texto?.substring(0, 200) || 'Conteúdo não disponível',
    };
  }
}

/**
 * Main verification handler
 * POST /api/verificar
 */
async function verificar(req, res, next) {
  try {
    const { texto, link, cidade, categoria, modo } = req.body;
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    // Validação básica
    const conteudo = modo === 'texto' ? texto : link;
    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Texto ou link inválido',
        },
      });
    }

    // Processar análises em paralelo
    const [analiseIA, factChecks, textoExtraido] = await Promise.all([
      analyzeToxicity(conteudo),
      getFactChecks(conteudo, GOOGLE_API_KEY),
      extractContent(texto, link, modo),
    ]);

    // Formatar resposta conforme esperado pelo frontend
    const result = {
      sucesso: true,
      dados: {
        analiseIA,
        factChecks,
        texto: textoExtraido,
        metadados: {
          modo,
          cidade,
          categoria,
          dataAnalise: new Date().toISOString(),
        },
      },
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro no verificador:', err);
    next(err);
  }
}

/**
 * Public health check para verificador
 */
async function statusVerificador(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      verificador: 'disponível',
      versao: '1.0.0',
    },
  });
}

module.exports = { verificar, statusVerificador };
