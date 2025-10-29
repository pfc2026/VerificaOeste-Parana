require('dotenv').config();
const fetch = require('node-fetch');

// Certifique-se de que estas variáveis estejam no seu arquivo .env
const API_KEY = process.env.GOOGLE_API_KEY;
const API_url_base = process.env.FACT_CHECK_BASE_URL; 
const API_ENDPOINT = '/v1alpha1/claims:search'; // Endpoint da API Fact Check

async function testGoogleFactCheckAPI(queryText) {
    try {
        if (!API_KEY) {
            throw new Error('API_KEY não configurada. Verifique o arquivo .env');
        }
        if (!API_url_base) {
             throw new Error('FACT_CHECK_BASE_URL não configurada. Verifique o arquivo .env');
        }
        if (!queryText) {
             throw new Error('O texto de consulta não pode ser vazio.');
        }
        
        // 1. CONSTRUÇÃO CORRETA DA URL COM TODOS OS PARÂMETROS
        const params = new URLSearchParams({
            query: queryText, // PARÂMETRO OBRIGATÓRIO
            languageCode: 'pt-BR',
            key: API_KEY // A CHAVE DA API
        });
        
        // Constrói a URL final: BASE_URL + ENDPOINT + ? + PARÂMETROS
        const finalUrl = `${API_url_base}${API_ENDPOINT}?${params.toString()}`;

        console.log('Chamando API em:', finalUrl);
        
        // Usar método GET e a URL completa
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }
            throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (data.claims && data.claims.length > 0) {
            console.log(`\n✓ Encontradas ${data.claims.length} verificação(ões) para "${queryText}":\n`);
            data.claims.forEach((claim, index) => {
                console.log(`--- Verificação ${index + 1} ---`);
                console.log('Alegação:', claim.text);
                console.log('Autor:', claim.claimant || 'N/A');
                if (claim.claimReview && claim.claimReview.length > 0) {
                    claim.claimReview.forEach(review => {
                        console.log('Verificador:', review.publisher?.name || 'N/A');
                        console.log('Avaliação:', review.textualRating || 'N/A');
                        console.log('URL:', review.url || 'N/A');
                    });
                }
                console.log('');
            });
        } else {
            console.log(`\n✗ Nenhuma verificação encontrada para a consulta: "${queryText}".`);
        }
        
        console.log('\nResposta completa da API:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao testar a API:', error.message);
    }
}

// Teste com um texto exemplo
const textoTeste = 'vacina covid';
testGoogleFactCheckAPI(textoTeste);