// main.js

const API_CONFIG = {
    baseURL: 'http://localhost:3000',
    endpoints: {
        verify: '/api/verificar'
    }
};

const verificationForm = document.getElementById('verificationForm');
const newsText = document.getElementById('newsText');
const newsLink = document.getElementById('newsLink');
const citySelect = document.getElementById('citySelect');
const categorySelect = document.getElementById('categorySelect');
const loadingSpinner = document.querySelector('.loading-spinner');
const btnText = document.querySelector('.btn-text');

if (verificationForm) {
    console.log('🎯 Formulário encontrado, adicionando listener...');
    verificationForm.addEventListener('submit', handleFormSubmit);
} else {
    console.error('❌ Formulário não encontrado!');
}

const WESTERN_CITIES = [
    'Cascavel', 'Foz do Iguaçu', 'Toledo', 'Marechal Cândido Rondon', 
    'Medianeira', 'Laranjeiras do Sul', 'Francisco Beltrão', 'Pato Branco',
    'Matelândia', 'Santa Tereza do Oeste', 'Santa Terezinha de Itaipu'
];

const REGIONAL_SOURCES = [
    'Rádio Colméia',
    'Cascavel News', 
    'Jornal O Paraná',
    'Rádio Clube',
    'Tribuna do Paraná',
    'Gazeta do Povo - Regional',
    'Rádio Cultura',
    'Jornal de Toledo'
];

function createModal(modalId) {
    console.log('🎨 Criando modal:', modalId);
    let modalEl = document.getElementById(modalId);
    
    if (!modalEl) {
        console.log('📦 Modal não existe, criando novo...');
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-fullscreen-sm-down modal-lg">
                    <div class="modal-content">
                        <div class="modal-header border-bottom sticky-top bg-white">
                            <h5 class="modal-title text-wrap" id="${modalId}Label">Resultado da Verificação</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="modalContent" style="max-width: 100%; overflow-x: hidden;">
                        </div>
                        <div class="modal-footer border-top">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById(modalId);
        console.log('✅ Modal criado com sucesso');
    }

    return new bootstrap.Modal(modalEl);
}

function populateSelects() {
    WESTERN_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city.toLowerCase().replace(/\s/g, '-');
        option.textContent = city;
        citySelect.appendChild(option);
    });

    ['Política', 'Economia', 'Segurança', 'Saúde', 'Geral'].forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

window.onload = populateSelects;

async function simulateRegionalVerification(text, city, category) {
    return new Promise((resolve) => {
        setTimeout(() => {
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
                explanation = `Notícia sobre ${city} apresenta padrões comuns de desinformação regional.`;
            } else if (hasTrueIndicators) {
                verdict = 'VERDADEIRA';
                confidence = 92;
                explanation = `Informação condiz com fontes oficiais da região de ${city}.`;
            } else {
                verdict = 'INCONCLUSIVO';
                confidence = 65;
                explanation = `Recomenda-se verificar em fontes oficiais de ${city}.`;
            }
            
            const result = {
                id: Date.now(),
                text: text.substring(0, 100) + '...',
                verdict: verdict,
                confidence: confidence,
                city: city,
                category: category,
                sources: REGIONAL_SOURCES.slice(0, 4),
                explanation: explanation,
                regionalTips: 'Consulte fontes oficiais do município',
                timestamp: new Date().toISOString()
            };
            
            resolve(result);
        }, 2000);
    });
}

function setLoadingState(isLoading) {
    if (isLoading) {
        loadingSpinner.style.display = 'inline-block';
        btnText.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        btnText.style.display = 'inline-block';
    }
}

function showAlert(message, type = 'warning') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} glass-card alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.getElementById('alertContainer').innerHTML = '';
    document.getElementById('alertContainer').appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

function createResultsModal() {
    const modalId = 'resultsModal';
    let modalEl = document.getElementById(modalId);
    
    if (!modalEl) {
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content glass-card">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">
                                <i class="fas fa-search me-2"></i>
                                Resultado da Verificação
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="modalContent">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalEl = document.getElementById(modalId);
    }
    return new bootstrap.Modal(modalEl);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    setLoadingState(true);
    
    try {
        const texto = newsText.value.trim();
        const link = newsLink.value.trim();
        const selectedCity = citySelect.value;
        const selectedCategory = categorySelect.value;

        const isLinkMode = !!link;
        const isTextMode = !!texto;
        
        if (!isTextMode && !isLinkMode) {
            showAlert('Por favor, digite o texto OU cole um link da notícia para verificação.', 'warning');
            setLoadingState(false);
            return;
        }
        
        if (isTextMode && isLinkMode) {
            showAlert('Por favor, escolha apenas UM método: texto ou link.', 'warning');
            setLoadingState(false);
            return;
        }

        console.log('📝 Dados do formulário:', {
            modo: isLinkMode ? 'link' : 'texto',
            texto: isTextMode ? texto : null,
            link: isLinkMode ? link : null,
            cidade: selectedCity,
            categoria: selectedCategory
        });

        console.log('🔄 Iniciando requisição...');

        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.verify}`;
        console.log('🌐 URL da requisição:', url);

        const requestData = {
            texto: isTextMode ? texto : null,
            link: isLinkMode ? link : null,
            cidade: selectedCity,
            categoria: selectedCategory,
            modo: isLinkMode ? 'link' : 'texto'
        };
        
        console.log('📤 Dados sendo enviados:', requestData);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            console.error('❌ Erro na resposta:', response.status, response.statusText);
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        console.log('✅ Resposta recebida');
        const data = await response.json();
        console.log('📊 Dados recebidos:', data);

        if (data.sucesso) {
            console.log('✨ Criando modal com os resultados');
            const modal = createModal('resultadoModal');
            const modalContent = document.getElementById('modalContent');
            
            console.log('Dados recebidos para exibição:', data.dados);
            
            // Verifica se é uma análise de link ou de texto e se temos análise de IA
            const isLink = requestData.modo === 'link';
            const hasAIAnalysis = data.dados.analiseIA && typeof data.dados.analiseIA === 'object';

            // Início do HTML
            let htmlContent = '<div class="result-card">';

            // Cabeçalho
            htmlContent += `
                <h4 class="mb-3 text-center">
                    ${isLink ? 'Análise da Notícia' : 'Verificações Encontradas'}
                </h4>`;

            // Análise de IA (apenas para links)
            if (isLink && hasAIAnalysis) {
                console.log('🤖 Renderizando análise de IA:', data.dados.analiseIA);
                const analiseIA = data.dados.analiseIA;
                const score = analiseIA.porcentagemVerdade || analiseIA.credibilityScore || 0;
                
                htmlContent += `
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-robot me-2"></i>
                                Análise por Inteligência Artificial
                            </h5>
                        </div>
                        <div class="card-body">
                            <h5 class="mb-3 text-center">Probabilidade de veracidade</h5>
                            <div class="d-flex align-items-center justify-content-center mb-4">
                                <div class="progress" style="height: 40px; width: 80%;">
                                    <div class="progress-bar ${score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-danger'}" 
                                        role="progressbar" 
                                        style="width: ${score}%" 
                                        aria-valuenow="${score}" 
                                        aria-valuemin="0" 
                                        aria-valuemax="100">
                                        <span style="font-size: 1.2rem; font-weight: bold;">${score}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert ${score >= 70 ? 'alert-success' : score >= 40 ? 'alert-warning' : 'alert-danger'} text-center">
                                <i class="fas ${score >= 70 ? 'fa-check-circle' : score >= 40 ? 'fa-exclamation-circle' : 'fa-times-circle'} me-2"></i>
                                ${score >= 70 ? 'Esta notícia tem alta probabilidade de ser verdadeira.' : 
                                  score >= 40 ? 'Esta notícia tem elementos que precisam ser verificados.' : 
                                  'Esta notícia tem alta probabilidade de ser falsa.'}
                            </div>

                            ${data.dados.texto.titulo || data.dados.texto.conteudo ? `
                                <div class="mt-4">
                                    <h6 class="mb-3">Notícia Analisada:</h6>
                                    ${data.dados.texto.titulo ? `<p class="text-muted">${data.dados.texto.titulo}</p>` : ''}
                                    ${data.dados.texto.conteudo ? `
                                        <p class="small text-muted">
                                            ${data.dados.texto.conteudo.substring(0, 200).replace(/\n+/g, ' ')}...
                                        </p>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <div class="mt-3">
                                <h6>Detalhes da Análise:</h6>
                                <div class="row">
                                    ${data.dados.analiseIA.detalhes.map(detalhe => `
                                        <div class="col-12 col-sm-6 mb-2">
                                            <small>
                                                <strong>${detalhe.aspect}:</strong> 
                                                <span class="text-${detalhe.probability >= 70 ? 'success' : detalhe.probability >= 40 ? 'warning' : 'danger'}">
                                                    ${detalhe.probability}%
                                                </span>
                                            </small>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>`;
            }

            // Fact-checking section
            const factChecks = data.dados.factChecks ? (
                Array.isArray(data.dados.factChecks) ? data.dados.factChecks : 
                (data.dados.factChecks.resultados || [])
            ) : [];
            console.log('🔍 Fact checks encontrados:', factChecks);
            const quantidade = factChecks.length;
            const encontrados = quantidade > 0;

            // Se temos verificações ou estamos no modo de link
            if (encontrados || isLink) {

                // Statistics card (apenas para pesquisa por texto)
                if (!isLink && encontrados) {
                    htmlContent += `
                        <div class="card mb-4">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">
                                    <i class="fas fa-chart-pie me-2"></i>
                                    Resumo das Verificações
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info mb-4">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Encontramos <strong>${quantidade}</strong> verificações sobre este assunto
                                </div>
                                
                                <div class="row mb-4">
                                    <div class="col-4 text-center">
                                        <h3 class="text-danger">${factChecks.filter(f => (f.avaliacao || '').toLowerCase().includes('falso')).length}</h3>
                                        <small>FALSO</small>
                                    </div>
                                    <div class="col-4 text-center">
                                        <h3 class="text-warning">${factChecks.filter(f => (f.avaliacao || '').toLowerCase().includes('enganoso')).length}</h3>
                                        <small>ENGANOSO</small>
                                    </div>
                                    <div class="col-4 text-center">
                                        <h3 class="text-success">${factChecks.filter(f => (f.avaliacao || '').toLowerCase().includes('verdadeiro')).length}</h3>
                                        <small>VERDADEIRO</small>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }

                // Lista de verificações
                if (encontrados) {
                    htmlContent += `
                        <div class="card mb-4">
                            <div class="card-header ${isLink ? 'bg-secondary' : 'bg-light'} ${isLink ? 'text-white' : ''}">
                                <h5 class="mb-0">
                                    <i class="fas fa-list-ul me-2"></i>
                                    ${isLink ? 'Verificações Relacionadas' : 'Detalhes das Verificações'}
                                </h5>
                            </div>
                            <div class="card-body p-0">
                                <div class="result-details">
                                    ${factChecks.map(item => `
                                        <div class="result-item p-3 border-bottom ${
                                            (item.avaliacao || '').toLowerCase().includes('falso') ? 'border-danger bg-danger bg-opacity-10' : 
                                            (item.avaliacao || '').toLowerCase().includes('enganoso') ? 'border-warning bg-warning bg-opacity-10' : 
                                            'border-success bg-success bg-opacity-10'
                                        }">
                                            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-3">
                                                <span class="badge ${
                                                    (item.avaliacao || '').toLowerCase().includes('falso') ? 'bg-danger' : 
                                                    (item.avaliacao || '').toLowerCase().includes('enganoso') ? 'bg-warning text-dark' : 
                                                    'bg-success'
                                                } px-3 py-2 text-wrap fs-6">
                                                    ${item.avaliacao || 'Não especificado'}
                                                </span>
                                                <span class="badge bg-secondary px-3 py-2">
                                                    <i class="fas fa-check-circle me-1"></i>
                                                    ${item.verificador || 'Fonte desconhecida'}
                                                </span>
                                            </div>
                                            <div class="mt-2">
                                                <h6 class="fw-bold text-break mb-3">${item.alegacao || 'Sem descrição disponível'}</h6>
                                                <div class="d-flex flex-wrap gap-3 align-items-center">
                                                    <small class="text-muted">
                                                        <i class="fas fa-user me-1"></i>
                                                        ${item.autor || 'Autor não informado'}
                                                    </small>
                                                    ${item.url_revisao ? `
                                                        <a href="${item.url_revisao}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-external-link-alt me-1"></i>
                                                            Ver verificação completa
                                                        </a>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>`;
                } else {
                    // Se não encontrou verificações mas tem análise de IA
                    if (isLink && hasAIAnalysis) {
                        htmlContent += `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Não encontramos verificações anteriores sobre esta notícia em nossa base de dados.
                                <hr>
                                <small class="d-block mt-2">
                                    <i class="fas fa-robot me-1"></i>
                                    Você pode consultar a análise de IA acima para uma avaliação preliminar do conteúdo.
                                </small>
                            </div>`;
                    } else {
                        htmlContent += `
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Nenhuma verificação encontrada na nossa base de dados para este ${isLink ? 'link' : 'texto'}.
                                ${isLink ? '<hr><small class="d-block mt-2">Aguarde enquanto nossa IA analisa o conteúdo...</small>' : ''}
                            </div>`;
                    }
                }
            }

            // Fecha div principal
            htmlContent += '</div>';
            
            // Atualiza o conteúdo do modal
            modalContent.innerHTML = htmlContent;
            modal.show();
            console.log('✅ Modal exibido com sucesso');
        } else {
            showAlert('Não foi possível verificar a notícia. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao processar a requisição. Tente novamente.', 'error');
    } finally {
        setLoadingState(false);
    }
}