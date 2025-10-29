// =================================================================
// 1. CONFIGURAÇÕES E SELETORES DO DOM
// =================================================================

// Configurações da API do seu Backend
const API_CONFIG = {
    baseURL: 'http://localhost:5000',
    endpoints: {
        verify: '/api/verificar'
    }
};

// Elementos do DOM (Assumindo que existem no HTML)
const verificationForm = document.getElementById('verificationForm');
const newsText = document.getElementById('newsText');
const citySelect = document.getElementById('citySelect');
const categorySelect = document.getElementById('categorySelect');
const loadingSpinner = document.querySelector('.loading-spinner');
const btnText = document.querySelector('.btn-text');
const alertContainer = document.getElementById('alertContainer');

// Municípios do Oeste do Paraná (Lista completa)
const WESTERN_CITIES = [
    'Cascavel', 'Foz do Iguaçu', 'Toledo', 'Marechal Cândido Rondon', 
    'Medianeira', 'Laranjeiras do Sul', 'Francisco Beltrão', 'Pato Branco',
    'Matelândia', 'Santa Tereza do Oeste', 'Santa Terezinha de Itaipu',
    'Assis Chateaubriand', 'Guaíra', 'Palotina', 'Corbélia', 'Santa Helena',
    'Nova Aurora', 'Capitão Leônidas Marques', 'Quedas do Iguaçu', 'Guaraniaçu'
    // ... adicione mais conforme necessário para 54 municípios
];

// Categorias
const CATEGORIES = [
    'Saúde', 'Política', 'Segurança', 'Economia', 'Educação', 'Outros'
];

// =================================================================
// 2. FUNÇÕES AUXILIARES
// =================================================================

// Função para mostrar alertas
function showAlert(message, type = 'info') {
    if (!alertContainer) return;
    
    // Remove alertas anteriores
    alertContainer.innerHTML = ''; 
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);

    // Remove o alerta após 5 segundos
    setTimeout(() => {
        const alertElement = alertContainer.querySelector('.alert');
        if (alertElement) {
            new bootstrap.Alert(alertElement).close();
        }
    }, 5000);
}

// Função para popular os dropdowns
function populateSelects() {
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Selecione a Cidade (Opcional)</option>';
        WESTERN_CITIES.sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city.toLowerCase().replace(/ /g, '-'); // Ex: cascavel
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
    
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Selecione a Categoria (Opcional)</option>';
        CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Simulação de verificação regional (MANTIDA do seu código)
async function simulateRegionalVerification(text, city, category) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // ... (A lógica de simulação regional permanece a mesma)
            
            const regionalIndicators = {
                fake: ['prefeitura de ' + city, 'câmara municipal', 'urgente região', 'compartilhe cascavel'],
                true: ['secretaria de saúde', 'detran regional', 'universidade estadual']
            };
            
            const hasFakeIndicators = regionalIndicators.fake.some(indicator => 
                text.toLowerCase().includes(indicator)
            );
            
            const hasTrueIndicators = regionalIndicators.true.some(indicator =>
                text.toLowerCase().includes(indicator)
            );
            
            let verdict, confidence, explanation;
            
            if (hasFakeIndicators && !hasTrueIndicators) {
                verdict = 'FALSA';
                confidence = 88;
                explanation = `Notícia sobre ${citySelect.options[citySelect.selectedIndex]?.text || 'a região'} apresenta padrões comuns de desinformação regional.`;
            } else if (hasTrueIndicators) {
                verdict = 'VERDADEIRA';
                confidence = 92;
                explanation = `Informação condiz com fontes oficiais da região de ${citySelect.options[citySelect.selectedIndex]?.text || 'Oeste do Paraná'}.`;
            } else {
                verdict = 'INCONCLUSIVO';
                confidence = 65;
                explanation = `Recomenda-se verificar em fontes oficiais de ${citySelect.options[citySelect.selectedIndex]?.text || 'sua cidade'}.`;
            }
            
            const result = {
                id: Date.now(),
                text: text.substring(0, 100) + '...',
                verdict: verdict,
                confidence: confidence,
                city: citySelect.options[citySelect.selectedIndex]?.text || 'Região Oeste',
                category: categorySelect.options[categorySelect.selectedIndex]?.text || 'Geral',
                sources: getRegionalSources(city),
                explanation: explanation,
                regionalTips: getRegionalTips(city),
                timestamp: new Date().toISOString()
            };
            
            resolve(result);
        }, 2000);
    });
}

// Obter fontes específicas da cidade
function getRegionalSources(cityValue) {
    const citySources = {
        'cascavel': ['Rádio Colméia', 'Cascavel News', 'Jornal O Paraná'],
        'foz-do-iguacu': ['Rádio Clube', 'Jornal de Foz', 'Tribuna do Paraná'],
        'toledo': ['Jornal de Toledo', 'Rádio Cultura Toledo'],
        'marechal-cândido-rondon': ['Rádio Difusora', 'Jornal O Presente']
    };
    
    return citySources[cityValue] || ['Fontes Regionais', 'Veículos Locais'];
}

// Dicas específicas por cidade
function getRegionalTips(cityValue) {
    const tips = {
        'cascavel': 'Verifique no site da Prefeitura de Cascavel',
        'foz-do-iguacu': 'Consulte o portal da Itaipu Binacional',
        'toledo': 'Confirme na Câmara Municipal de Toledo',
        'marechal-cândido-rondon': 'Veja no site da Prefeitura de Marechal'
    };
    
    return tips[cityValue] || 'Consulte fontes oficiais do município';
}


// Função para mostrar/esconder o loading
function setLoadingState(isLoading) {
    const submitButton = verificationForm.querySelector('button[type="submit"]');
    if (isLoading) {
        loadingSpinner.style.display = 'inline-block';
        btnText.style.display = 'none';
        submitButton.disabled = true;
    } else {
        loadingSpinner.style.display = 'none';
        btnText.style.display = 'inline-block';
        submitButton.disabled = false;
    }
}

// Criar o modal de resultados se não existir
function createResultsModal() {
    if (!document.getElementById('resultsModal')) {
        const modalHTML = `
            <div class="modal fade" id="resultsModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content glass-card">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">
                                <i class="fas fa-check-double me-2"></i>
                                Resultado da Verificação
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="modalContent">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    // Retorna a instância do Modal Bootstrap
    return new bootstrap.Modal(document.getElementById('resultsModal'));
}

// Função para mostrar resultados combinados
function showCombinedResults(googleData, regionalResult) {
    // [CORREÇÃO APLICADA AQUI]
    // 1. Garante que o modal HTML está no DOM E obtém a instância Bootstrap.
    const modalBootstrapInstance = createResultsModal(); 
    
    // 2. Agora o elemento 'modalContent' existe no DOM e pode ser acessado.
    const modalContent = document.getElementById('modalContent'); 
    
    if (!modalContent) {
        // Esta verificação deve capturar o erro, mas não deve mais ser atingida.
        showAlert('Erro interno: Não foi possível carregar o container de resultados.', 'danger');
        return;
    }

    // Mapeamento de classes para o veredito regional
    const verdictClass = regionalResult.verdict === 'FALSA' ? 'false-verdict' : 
                         regionalResult.verdict === 'VERDADEIRA' ? 'true-verdict' : 
                         'inconclusive-verdict';

    const resultsHTML = `
        <!-- Seu conteúdo HTML para o modal - (MANTIDO) -->
        <!-- ... (todo o HTML do resultado) ... -->
        <div class="verification-results">
            <!-- Resultado Regional -->
            <div class="regional-result mb-4">
                <div class="result-header d-flex align-items-center mb-3">
                    <div class="verdict-badge ${verdictClass}">
                        ${regionalResult.verdict}
                        ${regionalResult.city ? `<span class="region-badge">${regionalResult.city}</span>` : ''}
                    </div>
                    <div class="confidence-meter ms-auto">
                        <i class="fas fa-chart-bar me-2"></i>${regionalResult.confidence}% confiança
                    </div>
                </div>
                
                <div class="result-explanation glass-card p-3 mb-3">
                    <h6><i class="fas fa-info-circle me-2"></i>Análise Regional:</h6>
                    <p class="mb-0">${regionalResult.explanation}</p>
                </div>

                <div class="regional-sources glass-card p-3">
                    <h6><i class="fas fa-newspaper me-2"></i>Fontes Locais Relevantes:</h6>
                    <ul class="list-unstyled mb-0">
                        ${regionalResult.sources.map(source => `
                            <li><i class="fas fa-check-circle me-2 text-success"></i>${source}</li>
                        `).join('')}
                    </ul>
                </div>
                <p class="mt-3 small text-muted">${regionalResult.regionalTips}</p>
            </div>

            <!-- Verificações Google -->
            <div class="google-verifications mt-4 pt-3 border-top">
                <h6 class="section-title">
                    <i class="fab fa-google me-2"></i>
                    Verificações Encontradas (${googleData.quantidade})
                </h6>

                ${!googleData.encontrados ? `
                    <div class="alert alert-info glass-card">
                        <i class="fas fa-info-circle me-2"></i>
                        Não encontramos verificações externas para esta notícia no momento.
                        <hr>
                        <small>Dica: Os resultados do Google se baseiam em verificações já publicadas no mundo.</small>
                    </div>
                ` : `
                    <div class="verifications-list">
                        ${googleData.resultados.map(result => `
                            <div class="verification-item glass-card p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="mb-0">${result.titulo}</h6> 
                                    <span class="badge bg-primary">${result.avaliacao}</span>
                                </div>
                                <p class="text-muted small mb-2">Alegação: ${result.alegacao}</p>
                                <div class="verification-meta d-flex align-items-center">
                                    <small class="me-3">
                                        <i class="fas fa-user-check me-1"></i>
                                        ${result.verificador}
                                    </small>
                                    ${result.url_revisao ? `
                                        <a href="${result.url_revisao}" 
                                           target="_blank" 
                                           class="btn btn-sm btn-outline-primary ms-auto">
                                            Ver verificação completa
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            <div class="modal-footer mt-4">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                <button type="button" class="btn btn-success" 
                        onclick="shareRegionalResult('${regionalResult.city}')">
                    <i class="fas fa-share me-2"></i>Compartilhar Resultado
                </button>
            </div>
        </div>
    `;

    modalContent.innerHTML = resultsHTML;
    
    // 3. Mostrar o modal
    modalBootstrapInstance.show();
}


// Atualize o manipulador do formulário para garantir a lógica de exibição:
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const texto = newsText.value.trim();
    const selectedCityValue = citySelect.value;
    const selectedCategoryValue = categorySelect.value;
    
    if (!texto) {
        showAlert('Por favor, insira o texto da notícia para verificação.', 'warning');
        return;
    }
    
    setLoadingState(true);
    
    try {
        // [PASSO 1: Chamada ao Backend]
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.verify}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                texto: texto,
                cidade: selectedCityValue,
                categoria: selectedCategoryValue
            })
        });
        
        const backendResponse = await response.json();
        
        if (!response.ok || !backendResponse.sucesso) {
            const errorMessage = backendResponse.erro || 'Erro desconhecido ao verificar a notícia no backend.';
            throw new Error(errorMessage);
        }

        const googleData = backendResponse.dados; 

        // [PASSO 2: Simulação da Verificação Regional (Front-end)]
        const regionalResult = await simulateRegionalVerification(
            texto, 
            selectedCityValue, 
            selectedCategoryValue
        );
        
        // [PASSO 3: Exibir Resultados]
        showCombinedResults(googleData, regionalResult);
        
        // Limpa o campo de texto após o sucesso
        newsText.value = '';

    } catch (error) {
        console.error('Erro na verificação:', error);
        showAlert(`Erro na verificação: ${error.message}`, 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Compartilhar resultado regional
function shareRegionalResult(city) {
    const shareText = `Verifiquei uma notícia de ${city || 'Oeste do Paraná'} no VerificaOeste e o veredito regional foi: ${document.querySelector('.verdict-badge').textContent.trim()}!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'VerificaOeste - Notícias do Oeste do Paraná',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + ' Acesso: ' + window.location.href);
        showAlert('Informações copiadas para a área de transferência!', 'success');
    }
}

// =================================================================
// 4. INICIALIZAÇÃO
// =================================================================

// Event Listener
if (verificationForm) {
    verificationForm.addEventListener('submit', handleFormSubmit);
    populateSelects(); // Preenche os dropdowns ao carregar
}

// CSS adicional para classes de veredito (MANTIDO do seu código)
const regionalCSS = `
    .false-verdict {
        background: linear-gradient(135deg, var(--danger, #dc3545), #c82333);
        color: white;
    }
    .true-verdict {
        background: linear-gradient(135deg, var(--success, #28a745), #1e7e34);
        color: white;
    }
    .inconclusive-verdict {
        background: linear-gradient(135deg, var(--warning, #ffc107), #d39e00);
        color: white;
    }
    .verdict-badge {
        font-size: 1.2em;
        font-weight: bold;
        padding: 8px 15px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: inline-flex;
        align-items: center;
    }
    .region-badge {
        font-size: 0.7em;
        margin-left: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.3);
    }
    /* Remove styling from search form */
    .search-container.glass-card {
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
    }
    
    /* Solid background for results to ensure readability */
    .verification-results .glass-card,
    .modal-content.glass-card {
        background: rgb(240, 240, 240) !important;
        border-radius: 4px !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
        padding: 15px !important;
    }
    .result-explanation {
        border-left: 4px solid var(--info, #0dcaf5);
    }
`;

// Adicionar CSS regional
const regionalStyle = document.createElement('style');
regionalStyle.textContent = regionalCSS;
document.head.appendChild(regionalStyle);