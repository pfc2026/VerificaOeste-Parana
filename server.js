<<<<<<<< HEAD:server.js
// server.js
const express = require('express');
require('dotenv').config();
const { verificarNoticia } = require('./googleService.js');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Servir arquivos estáticos

// Configurar CORS para desenvolvimento
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});
app.post('/api/verificar', async (req, res) => {
    try {
        console.log('📨 Requisição recebida:', req.body);
        
        const { texto } = req.body;
        
        if (!texto || texto.trim().length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Texto não fornecido para verificação'
            });
        }
        
        console.log('🔑 API Key configurada:', !!process.env.GOOGLE_API_KEY);
        
        // Chamar a API do Google
        const resultado = await verificarNoticia(texto);
        
        res.json({
            sucesso: true,
            dados: resultado
        });
        
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando! ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>  {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
========
// server.js
require('dotenv').config();
const express = require('express');
const { verificarNoticia } = require('./googleService');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Servir arquivos estáticos

// Configurar CORS para desenvolvimento
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.post('/api/verificar', async (req, res) => {
    try {
        const { texto } = req.body;
        
        if (!texto || texto.trim().length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Texto não fornecido para verificação'
            });
        }
        
        console.log('📨 Recebido:', texto);
        console.log('🔑 API Key configurada:', !!process.env.GOOGLE_API_KEY);
        
        // Chamar a API do Google
        const resultado = await verificarNoticia(texto);
        
        res.json({
            sucesso: true,
            dados: resultado
        });
        
    } catch (error) {
        res.status(500).json({
            sucesso: false,
            erro: error.message
        });
    }
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando! ✅' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
>>>>>>>> bb28182e4f794cfc1eae066cd6bea2fe1e8e6bee:js/server.js
