require('dotenv').config();
const fetch = require('node-fetch');
const API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_CSE_ID; // ID do mecanismo de pesquisa personalizado

async function verificarNoticia(texto) {
    try {
        if (!API_KEY) {
            throw new Error('API_KEY não configurada. Verifique o arquivo .env');
        }
        if (!CX) {
            throw new Error('GOOGLE_CSE_ID não configurado. Verifique o arquivo .env');
        }
        if (!texto || texto.trim().length === 0) {
            throw new Error('Texto não fornecido para verificação');
        }

        console.log('🔍 Verificando com Google Custom Search API...');
        console.log('API Key:', API_KEY ? 'Configurada' : 'Não configurada');
        console.log('CSE ID:', CX ? 'Configurado' : 'Não configurado');

        const url = new URL('https://www.googleapis.com/customsearch/v1');
        url.searchParams.append('key', API_KEY);
        url.searchParams.append('cx', CX);
        url.searchParams.append('q', texto.trim());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Processa e formata os resultados
        const resultados = data.items?.map(item => ({
            titulo: item.title,
            link: item.link,
            snippet: item.snippet
        })) || [];

        return {
            encontrados: resultados.length > 0,
            quantidade: resultados.length,
            resultados: resultados
        };

    } catch (error) {
        console.error('❌ Erro ao verificar notícia:', error);
        throw error;
    }
}

module.exports = { verificarNoticia };
