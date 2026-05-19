const mongoose = require('mongoose');

/**
 * Modelo para salvar “notícias pesquisadas”.
 *
 * Campos projetados para armazenar:
 * - entrada do usuário (texto/link)
 * - resultado do processamento (veredito/score/fontes/metadata)
 * - vínculo com o usuário (usuario)
 *
 * Observação:
 * - `resultado` usa Mixed porque a estrutura pode evoluir.
 */
const SearchSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Entrada do usuário
    modo: {
      type: String,
      enum: ['texto', 'link'],
      required: true,
      index: true,
    },
    texto: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },

    // Resultado do processamento (ML + fact-check + heurísticas, etc.)
    resultado: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Campos facilitadores para filtros comuns
    veredito: {
      type: String,
      default: '',
      index: true,
    },
    porcentagem: {
      type: Number,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Search', SearchSchema);

