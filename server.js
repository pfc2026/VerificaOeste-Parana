// server.js
require('dotenv').config();
const express = require('express');
const { verificarNoticia } = require('./googleService');
const axios = require('axios');
const cheerio = require('cheerio');
const toxicity = require('@tensorflow-models/toxicity');

// Initialize TensorFlow model
let model = null;
async function initializeModel() {
    try {
        console.log('🤖 Inicializando modelo TensorFlow...');
        // Load with default threshold and all available labels
        model = await toxicity.load();
        console.log('✅ Modelo TensorFlow carregado com sucesso!');
        return model;
    } catch (error) {
        console.error('❌ Erro ao carregar modelo TensorFlow:', error);
        throw error;
    }
}

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configurar CORS para desenvolvimento
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Função para extrair texto de uma URL
async function extrairTextoDoLink(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        
        // Detecta e converte a codificação corretamente
        const contentType = response.headers['content-type'];
        const charset = contentType && contentType.includes('charset=') 
            ? contentType.split('charset=')[1] 
            : 'utf-8';
            
        const html = new TextDecoder(charset).decode(response.data);
        const $ = cheerio.load(html, { decodeEntities: true });
        
        // Remove scripts, styles e tags desnecessárias
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();
        
        // Extrai o texto principal
        const title = $('h1').first().text() || '';
        const content = $('article').text() || $('main').text() || $('body').text();
        
        // Limpa e normaliza o texto
        const cleanText = (text) => {
            return text
                .replace(/[\r\n]+/g, ' ')     // Remove quebras de linha extras
                .replace(/\s+/g, ' ')         // Remove espaços extras
                .trim();
        };
        
        return {
            title: cleanText(title),
            content: cleanText(content)
        };
    } catch (error) {
        console.error('Erro ao extrair texto do link:', error);
        throw new Error('Não foi possível extrair o texto do link fornecido');
    }
}

// Função para análise de texto usando TensorFlow
async function analisarTextoComTensorFlow(texto) {
    try {
        console.log('📊 Iniciando análise com TensorFlow e heurística...');
        
        // Garante que o modelo está carregado
        if (!model) {
            await initializeModel();
        }
        
        // Análise com TensorFlow
        console.log('🤖 Iniciando análise TensorFlow do texto...');
        const tfPredictions = await model.classify([texto]);
        
        // Extrai e normaliza os scores do TensorFlow (0-100 scale)
        const tfScores = {
            toxicity: (1 - tfPredictions.find(p => p.label === 'toxicity')?.results[0]?.probabilities[1] || 0) * 100,
            severeToxicity: (1 - tfPredictions.find(p => p.label === 'severe_toxicity')?.results[0]?.probabilities[1] || 0) * 100,
            threat: (1 - tfPredictions.find(p => p.label === 'threat')?.results[0]?.probabilities[1] || 0) * 100,
            insult: (1 - tfPredictions.find(p => p.label === 'insult')?.results[0]?.probabilities[1] || 0) * 100
        };
        
        // Normaliza o texto para análise
        const lowerText = texto.toLowerCase();
        
        // Indicadores de baixa confiabilidade (palavras e padrões suspeitos)
        const warningPatterns = {
            urgencia: [
                'urgente', 'atenção', 'última hora', 'agora pouco',
                'corre', 'alerta', 'aviso importante'
            ],
            sensacionalismo: [
                'incrível', 'chocante', 'impressionante', 'surreal',
                'absurdo', 'você não vai acreditar', 'inacreditável'
            ],
            conspiracao: [
                'conspiração', 'querem esconder', 'não divulgado pela mídia',
                'a verdade oculta', 'o que não contaram', 'revelado',
                'segredo', 'querem que você não saiba'
            ],
            emocional: [
                'bomba', 'polêmico', 'escândalo', 'polemico', 'polêmica',
                'revoltante', 'absurdo total', 'vergonhoso'
            ]
        };

        // Indicadores de alta confiabilidade
        const reliabilityPatterns = {
            fontesOficiais: [
                'segundo', 'conforme', 'de acordo com',
                'afirmou', 'declarou', 'informou',
                'confirmou', 'divulgou', 'anunciou'
            ],
            instituicoes: [
                'ministério', 'secretaria', 'prefeitura',
                'governo', 'instituto', 'universidade',
                'polícia', 'departamento', 'agência'
            ],
            dados: [
                'pesquisa', 'estudo', 'dados', 'relatório',
                'análise', 'investigação', 'levantamento',
                'estatística', 'índice', 'percentual'
            ],
            especialistas: [
                'especialista', 'pesquisador', 'cientista',
                'professor', 'doutor', 'especializada',
                'profissional', 'autoridade'
            ]
        };
        
        // Análise detalhada do texto
        function findPatternMatches(patterns) {
            let matches = {};
            for (let category in patterns) {
                matches[category] = patterns[category].filter(word => {
                    const regex = new RegExp(`\\b${word}\\b`, 'i');
                    return regex.test(lowerText);
                });
            }
            return matches;
        }

        // Encontra todas as correspondências
        const warningMatches = findPatternMatches(warningPatterns);
        const reliabilityMatches = findPatternMatches(reliabilityPatterns);

        // Análise de estrutura do texto
        const sentencesCount = texto.split(/[.!?]+/).length;
        const averageWordLength = texto.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / texto.split(/\s+/).length;
        const hasQuotes = (texto.match(/["'"']/g) || []).length > 0;
        const hasNumbers = /\d+([,.]\d+)?%?/.test(texto);
        const hasLinks = /https?:\/\/[^\s]+/.test(texto);

        // Inicialização dos scores
        let baseCredibilityScore = (tfScores.toxicity + tfScores.severeToxicity) / 2; // Base score from TensorFlow
        let sensationalismScore = 0;
        let objectivityScore = (tfScores.threat + tfScores.insult) / 2;

        // Ajustes baseados em padrões de alerta
        Object.entries(warningMatches).forEach(([category, matches]) => {
            const impact = matches.length * (
                category === 'urgencia' ? 8 :
                category === 'sensacionalismo' ? 12 :
                category === 'conspiracao' ? 15 :
                category === 'emocional' ? 10 : 5
            );
            baseCredibilityScore -= impact;
            sensationalismScore += impact * 1.5;
            objectivityScore -= impact;
        });

        // Ajustes baseados em padrões de confiabilidade
        Object.entries(reliabilityMatches).forEach(([category, matches]) => {
            const impact = matches.length * (
                category === 'fontesOficiais' ? 10 :
                category === 'instituicoes' ? 8 :
                category === 'dados' ? 12 :
                category === 'especialistas' ? 10 : 5
            );
            baseCredibilityScore += impact;
            objectivityScore += impact * 0.5;
        });

        // Ajustes baseados na estrutura do texto
        if (sentencesCount > 3) baseCredibilityScore += 5;
        if (averageWordLength > 5) baseCredibilityScore += 3;
        if (hasQuotes) baseCredibilityScore += 8;
        if (hasNumbers) baseCredibilityScore += 10;
        if (hasLinks) baseCredibilityScore += 5;

        // Normalização dos scores
        baseCredibilityScore = Math.max(0, Math.min(100, baseCredibilityScore));
        sensationalismScore = Math.max(0, Math.min(100, sensationalismScore));
        objectivityScore = Math.max(0, Math.min(100, objectivityScore));
        
        // Log do resultado da análise TensorFlow
        console.log('🤖 Análise IA concluída:', {
            toxicity: tfScores.toxicity.toFixed(1) + '%',
            severeToxicity: tfScores.severeToxicity.toFixed(1) + '%',
            threat: tfScores.threat.toFixed(1) + '%',
            insult: tfScores.insult.toFixed(1) + '%'
        });
        
        // Log detalhado da análise combinada
        console.log('📊 Análise detalhada:', {
            tensorflow: {
                toxicidade: tfScores.toxicity.toFixed(1) + '%',
                toxicidadeSevera: tfScores.severeToxicity.toFixed(1) + '%',
                ameaca: tfScores.threat.toFixed(1) + '%',
                insulto: tfScores.insult.toFixed(1) + '%'
            },
            heuristica: {
                indicadoresNegativos: warningMatches,
                indicadoresPositivos: reliabilityMatches,
                estrutura: {
                    sentencas: sentencesCount,
                    tamMedioPalavras: averageWordLength.toFixed(2),
                    temCitacoes: hasQuotes,
                    temNumeros: hasNumbers,
                    temLinks: hasLinks
                }
            }
        });

        // Normalização final dos scores após análise do TensorFlow
        baseCredibilityScore = Math.max(0, Math.min(100, baseCredibilityScore));
        sensationalismScore = Math.max(0, Math.min(100, sensationalismScore));
        objectivityScore = Math.max(0, Math.min(100, objectivityScore));

        console.log('📈 Scores finais (combinados TensorFlow + Heurística):', {
            credibilidade: baseCredibilityScore.toFixed(1),
            sensacionalismo: sensationalismScore.toFixed(1),
            objetividade: objectivityScore.toFixed(1)
        });

        // Gera explicações baseadas na análise
        const explanations = [];
        if (baseCredibilityScore >= 80) {
            explanations.push('Alto nível de credibilidade devido à presença de fontes oficiais e dados verificáveis');
        } else if (baseCredibilityScore <= 40) {
            explanations.push('Baixa credibilidade devido a elementos sensacionalistas e falta de fontes verificáveis');
        }

        if (sensationalismScore >= 70) {
            explanations.push('Presença significativa de linguagem sensacionalista');
        }

        if (objectivityScore >= 80) {
            explanations.push('Apresentação objetiva dos fatos com dados e fontes');
        } else if (objectivityScore <= 40) {
            explanations.push('Carência de objetividade na apresentação das informações');
        }
        
        return {
            credibilityScore: Math.round(baseCredibilityScore),
            details: [
                { 
                    aspect: 'Confiabilidade',
                    probability: Math.round(baseCredibilityScore),
                    explanation: explanations.join('. ')
                },
                { 
                    aspect: 'Sensacionalismo',
                    probability: Math.round(sensationalismScore),
                    indicators: Object.values(warningMatches)
                        .flat()
                        .slice(0, 3)
                        .join(', ')
                },
                { 
                    aspect: 'Objetividade',
                    probability: Math.round(objectivityScore),
                    indicators: Object.values(reliabilityMatches)
                        .flat()
                        .slice(0, 3)
                        .join(', ')
                }
            ]
        };
    } catch (error) {
        console.error('Erro na análise:', error);
        return {
            credibilityScore: 50,
            details: [
                { aspect: 'Confiabilidade', probability: 50 },
                { aspect: 'Sensacionalismo', probability: 50 },
                { aspect: 'Objetividade', probability: 50 }
            ]
        };
    }
    
    /* 
    // Código legado - Análise com TensorFlow
    // Mantido como referência para futura implementação
    
    // Analisa diferentes aspectos do texto
    predictions.forEach(prediction => {
        const avgProbability = prediction.results[0].probabilities[1];
        
        // Reduz a credibilidade baseado em aspectos negativos
        if (prediction.label === 'toxicity' || prediction.label === 'threat') {
            finalScore -= (avgProbability * 0.3);
        }
        if (prediction.label === 'identity_attack' || prediction.label === 'insult') {
            finalScore -= (avgProbability * 0.2);
        }
        if (prediction.label === 'obscene' || prediction.label === 'severe_toxicity') {
            finalScore -= (avgProbability * 0.2);
        }
    });
    */
}

app.post('/api/verificar', async (req, res) => {
    try {
        const { texto, modo, link } = req.body;
        console.log('📝 Modo:', modo, 'Link:', link, 'Texto:', texto?.substring(0, 100));

        let textoParaAnalisar;
        let textoExtraido = { title: '', content: '' };

        // Determina o texto a ser analisado baseado no modo
        if (modo === 'link' && link) {
            console.log('📨 Recebido link para análise:', link);
            textoExtraido = await extrairTextoDoLink(link);
            console.log('📄 Texto extraído do link');
            textoParaAnalisar = `${textoExtraido.title}\n\n${textoExtraido.content}`;
        } else if (modo === 'texto' && texto) {
            console.log('📨 Recebido texto para verificação');
            textoParaAnalisar = texto;
        } else {
            return res.status(400).json({
                sucesso: false,
                erro: 'Modo de verificação inválido ou texto/link não fornecido'
            });
        }

        // Análise com TensorFlow e fact-checking
        const analiseIA = await analisarTextoComTensorFlow(textoParaAnalisar);
        console.log('🤖 Análise IA concluída:', analiseIA);
        const factChecks = await verificarNoticia(textoParaAnalisar);

        // Prepara a resposta
        const resposta = {
            sucesso: true,
            dados: {
                analiseIA: {
                    porcentagemVerdade: analiseIA.credibilityScore,
                    detalhes: analiseIA.details,
                    textoAnalisado: modo === 'link' ? textoExtraido.title : texto?.substring(0, 100)
                },
                factChecks: factChecks,
                texto: modo === 'link' ? {
                    titulo: textoExtraido.title,
                    conteudo: textoExtraido.content.substring(0, 500) + '...'
                } : {
                    conteudo: texto
                }
            }
        };

        console.log('� Enviando resposta:', JSON.stringify(resposta, null, 2));
        return res.json(resposta);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Nova rota para verificação por link com ML
app.post('/api/verificar-link', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !url.trim()) {
            return res.status(400).json({
                sucesso: false,
                erro: 'URL não fornecida para verificação'
            });
        }

        console.log('🔗 Recebido URL:', url);

        // 1. Scraping do texto da URL
        const scrapedText = await scrapeTextFromUrl(url);
        if (!scrapedText || scrapedText.trim().length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Não foi possível extrair texto da URL fornecida'
            });
        }

        // 2. Análise de sentimento/toxicidade com TensorFlow.js
        const toxicityResult = await analyzeToxicity(scrapedText);

        // 3. Cálculo de veracidade baseado em heurísticas
        const veracityScore = calculateVeracityScore(scrapedText, toxicityResult);

        // 4. Verificação com Google Fact Check API usando o texto extraído
        const googleResult = await verificarNoticia(scrapedText);

        // 5. Combinar resultados
        const analysis = {
            url: url,
            extractedText: scrapedText.substring(0, 500) + '...', // Preview do texto
            mlAnalysis: {
                toxicityScore: toxicityResult.toxicityScore,
                sentiment: toxicityResult.sentiment,
                veracityPercentage: veracityScore.percentage,
                veracityVerdict: veracityScore.verdict,
                explanation: veracityScore.explanation
            },
            googleVerification: googleResult
        };

        res.json({
            sucesso: true,
            dados: analysis
        });

    } catch (error) {
        console.error('Erro na verificação por link:', error);
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Função para scraping de texto da URL
async function scrapeTextFromUrl(url) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Remover scripts, estilos e elementos não relevantes
        $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();

        // Extrair texto dos elementos principais
        const textElements = $('article, .content, .post, .entry, p, h1, h2, h3, h4, h5, h6').text();

        // Limpar e normalizar o texto
        const cleanText = textElements
            .replace(/\s+/g, ' ')
            .trim();

        return cleanText;
    } catch (error) {
        console.error('Erro no scraping:', error.message);
        throw new Error('Falha ao acessar ou processar a URL');
    }
}

// Função para análise de toxicidade com TensorFlow.js
let toxicityModel = null;

async function analyzeToxicity(text) {
    try {
        // Carregar modelo se não estiver carregado
        if (!toxicityModel) {
            toxicityModel = await toxicity.load(0.9);
        }

        // Classificar o texto
        const predictions = await toxicityModel.classify(text);

        // Calcular score de toxicidade geral
        const toxicityScore = predictions.reduce((acc, pred) => {
            return acc + (pred.results[0].probabilities[1] || 0);
        }, 0) / predictions.length;

        // Determinar sentimento baseado nas predições
        let sentiment = 'neutro';
        const insultProb = predictions.find(p => p.label === 'insult')?.results[0].probabilities[1] || 0;
        const threatProb = predictions.find(p => p.label === 'threat')?.results[0].probabilities[1] || 0;
        const obsceneProb = predictions.find(p => p.label === 'obscene')?.results[0].probabilities[1] || 0;

        if (toxicityScore > 0.7) {
            sentiment = 'muito negativo';
        } else if (toxicityScore > 0.4) {
            sentiment = 'negativo';
        } else if (toxicityScore < 0.2) {
            sentiment = 'positivo';
        }

        return {
            toxicityScore: Math.round(toxicityScore * 100),
            sentiment: sentiment,
            details: {
                insult: Math.round(insultProb * 100),
                threat: Math.round(threatProb * 100),
                obscene: Math.round(obsceneProb * 100)
            }
        };
    } catch (error) {
        console.error('Erro na análise de toxicidade:', error);
        return {
            toxicityScore: 0,
            sentiment: 'erro na análise',
            details: {}
        };
    }
}

// Função para calcular pontuação de veracidade
function calculateVeracityScore(text, toxicityResult) {
    let score = 50; // Pontuação base neutra
    let reasons = [];

    // Palavras sensacionalistas que indicam possível fake news
    const sensationalWords = [
        'urgente', 'exclusivo', 'chocante', 'incrível', 'impossível', 'revelação',
        'escândalo', 'conspiração', 'segredo', 'proibido', 'banido', 'censurado',
        'governo esconde', 'não querem que você saiba', 'verdade oculta'
    ];

    // Palavras confiáveis
    const reliableWords = [
        'segundo fontes oficiais', 'de acordo com', 'confirmado por', 'relatório oficial',
        'pesquisa científica', 'dados do governo', 'fonte confiável'
    ];

    const lowerText = text.toLowerCase();

    // Verificar palavras sensacionalistas
    const sensationalCount = sensationalWords.filter(word =>
        lowerText.includes(word.toLowerCase())
    ).length;

    // Verificar palavras confiáveis
    const reliableCount = reliableWords.filter(word =>
        lowerText.includes(word.toLowerCase())
    ).length;

    // Ajustar score baseado em palavras
    if (sensationalCount > 0) {
        score -= sensationalCount * 10;
        reasons.push(`${sensationalCount} palavra(s) sensacionalista(s) encontrada(s)`);
    }

    if (reliableCount > 0) {
        score += reliableCount * 15;
        reasons.push(`${reliableCount} indicador(es) de confiabilidade encontrado(s)`);
    }

    // Ajustar baseado na toxicidade
    if (toxicityResult.toxicityScore > 70) {
        score -= 20;
        reasons.push('Alto nível de toxicidade no texto');
    } else if (toxicityResult.toxicityScore < 30) {
        score += 10;
        reasons.push('Texto com tom neutro/positivo');
    }

    // Limitar score entre 0 e 100
    score = Math.max(0, Math.min(100, score));

    // Determinar veredito
    let verdict, explanation;
    if (score >= 70) {
        verdict = 'VERDADEIRA';
        explanation = 'Texto apresenta indicadores positivos de veracidade.';
    } else if (score >= 40) {
        verdict = 'INCONCLUSIVO';
        explanation = 'Texto apresenta características mistas. Recomenda-se verificação adicional.';
    } else {
        verdict = 'FALSA';
        explanation = 'Texto apresenta múltiplos indicadores de desinformação.';
    }

    if (reasons.length > 0) {
        explanation += ' Motivos: ' + reasons.join(', ') + '.';
    }

    return {
        percentage: Math.round(score),
        verdict: verdict,
        explanation: explanation
    };
}

// Rota de teste
app.get('/teste', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando! ✅' });
});

const PORT = process.env.PORT || 3000;
// Inicializa o modelo antes de iniciar o servidor
initializeModel()
    .then(() => {
        app.listen(3000, () => {
            console.log('🚀 Servidor rodando em http://localhost:3000');
        });
    })
    .catch(error => {
        console.error('❌ Erro fatal ao inicializar o modelo:', error);
        process.exit(1);
    });
