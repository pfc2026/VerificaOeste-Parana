require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_API_KEY;

async function testGoogleFactCheckAPI(queryText) {
    try {
        if (!API_KEY) {
            throw new Error('API_KEY não configurada. Verifique o arquivo .env');
        }

        // Construir a URL com parâmetros na query string
        const params = new URLSearchParams({
            query: queryText,
            languageCode: 'pt-BR',
            key: API_KEY
        });

        const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=AIzaSyBkKQOJrBwj3Bk3e3Pd9kS9kFqN8kKp8K4&query=termo_para_verificar${params}`;

        // Usar método GET ao invés de POST
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.claims && data.claims.length > 0) {
            console.log(`\n✓ Encontradas ${data.claims.length} verificação(ões):\n`);
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
            console.log('\n✗ Nenhuma verificação encontrada para esta consulta.');
        }
        
        console.log('\nResposta completa da API:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao testar a API:', error.message);
    }
}

// Teste com um texto exemplo
const textoTeste = 'vacina covid';
testGoogleFactCheckAPI(textoTeste);