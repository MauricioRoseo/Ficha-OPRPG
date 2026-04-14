const CharacterModel = require('../models/characterModel');
const AttributeModel = require('../models/attributeModel');
const FeatureService = require('./featureService');

const CharacterService = {
  createCharacter: (data, callback) => {
    if (data.level_mode === 'auto') {
      data.nivel = Math.floor(data.nex / 5);
    }

    CharacterModel.create(data, (err, result) => {
      if (err) return callback(err);

      const characterId = result.insertId;

      // 🔥 cria atributos automaticamente
      AttributeModel.create(characterId, (err2) => {
        if (err2) return callback(err2);

        callback(null, result);
      });
    });
  },

  getAllCharacters: (callback) => {
    CharacterModel.findAll(callback);
  },

  getCharactersByUser: (userId, callback) => {
    CharacterModel.findByUserId(userId, callback);
  },

  getFullCharacter: (characterId, userId, callback) => {
    const CharacterModel = require('../models/characterModel');
    const AttributeModel = require('../models/attributeModel');
    const FeatureService = require('./featureService');

    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);

      if (!character) {
        return callback({ message: 'Personagem não encontrado' });
      }

      // 🔒 validação de dono
      if (character.user_id !== userId) {
        return callback({ message: 'Acesso negado' });
      }

      // 🔥 atributos
      AttributeModel.findByCharacterId(characterId, (err2, attributes) => {
        if (err2) return callback(err2);

        // 🔥 features
        FeatureService.getCharacterFeaturesGrouped(characterId, (err3, features) => {
          if (err3) return callback(err3);

          // 🔒 protections
          const ProtectionModel = require('../models/protectionModel');
          ProtectionModel.findByCharacterId(characterId, (err4, protections) => {
            if (err4) return callback(err4);

                  // resistances
                  const ResistanceModel = require('../models/resistanceModel');
                  const InventoryModel = require('../models/inventoryModel');
                  ResistanceModel.findByCharacterId(characterId, (err5, resistances) => {
                    if (err5) return callback(err5);

                    // fetch inventory and compute carga fields
                    InventoryModel.findByCharacterId(characterId, (err6, items) => {
                      if (err6) return callback(err6);
                      const inventory = items || [];
                      const cargaAtual = inventory.reduce((acc, it) => acc + (Number(it.space) || 0), 0);
                      const attr = attributes[0] || { forca: 0 };
                      const cargaMaxima = (Number(attr.forca) > 0) ? (Number(attr.forca) * 5) : 2;

                      // ensure character object contains carga values (from DB or computed)
                      character.carga_atual = cargaAtual;
                      character.carga_maxima = cargaMaxima;

                      // fetch background, phobias and paranormal encounters
                      const BackgroundModel = require('../models/backgroundModel');
                      const CharacterPhobiaModel = require('../models/characterPhobiaModel');
                      const ParanormalModel = require('../models/paranormalModel');

                      BackgroundModel.findByCharacterId(characterId, (err7, background) => {
                        if (err7) return callback(err7);

                        CharacterPhobiaModel.findByCharacterId(characterId, (err8, phobias) => {
                          if (err8) return callback(err8);

                          ParanormalModel.findByCharacterId(characterId, (err9, encounters) => {
                            if (err9) return callback(err9);

                            callback(null, {
                              character,
                              attributes: attributes[0] || {},
                              features,
                              protections: protections || [],
                              resistances: resistances || {},
                              inventory: inventory,
                              background: background || null,
                              phobias: phobias || [],
                              paranormal_encounters: encounters || []
                            });
                          });
                        });
                      });
                    });
                  });
          });
        });
      });
    });
  }

    ,

    updateCharacter: (characterId, userId, data, callback) => {
      // valida dono antes de atualizar
      const CharacterModel = require('../models/characterModel');

      CharacterModel.findById(characterId, (err, character) => {
        if (err) return callback(err);
        if (!character) return callback({ message: 'Personagem não encontrado' });

        if (character.user_id !== userId) return callback({ message: 'Acesso negado' });

        // atualiza campos permitidos
        const payload = {
          vida_atual: data.vida_atual,
          vida_temp: data.vida_temp,
          esforco_atual: data.esforco_atual,
          esforco_temp: data.esforco_temp,
          sanidade_atual: data.sanidade_atual,
          defesa_passiva: data.defesa_passiva,
          esquiva: data.esquiva,
          bloqueio: data.bloqueio,
          morrendo: data.morrendo,
          enlouquecendo: data.enlouquecendo,
          proficiencias: data.proficiencias,
          patrimonio: data.patrimonio
        };

        CharacterModel.update(characterId, payload, (err2) => {
          if (err2) return callback(err2);
          // if proficiencies provided, update separately
          if (data.proficiencias !== undefined) {
            // parse prestigio from first line if present
            let prestigio = 0;
            try {
              const lines = (data.proficiencias || '').split(/\r?\n/);
              if (lines[0] && /\d+/.test(lines[0])) {
                const m = lines[0].match(/(\d+)/);
                if (m) prestigio = Number(m[1]);
              }
            } catch (e) { prestigio = 0; }

            // compute patente based on prestigio following business rules
            const computePatente = (p) => {
              if (p >= 200) return 'Agente de Elite';
              if (p >= 100) return 'Oficial de Operações';
              if (p >= 50) return 'Agente Especial';
              if (p >= 20) return 'Operador';
              return 'Recruta';
            };

            const patente = computePatente(prestigio);

            CharacterModel.updateProficiencies(characterId, data.proficiencias, prestigio, patente, (err3) => {
              if (err3) return callback(err3);
              callback(null, { message: 'Status e proficiências atualizados', prestigio, patente });
            });
          } else {
            callback(null, { message: 'Status atualizados' });
          }
        });
      });
    }
};

module.exports = CharacterService;