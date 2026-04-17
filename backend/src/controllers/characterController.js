const CharacterService = require('../services/characterService');

const CharacterController = {
  create: (req, res) => {
    const data = req.body;
    data.user_id = req.user.id;

    CharacterService.createCharacter(data, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      res.status(201).json({
        message: 'Personagem criado com sucesso!',
        id: result.insertId
      });
    });
  },

  delete: (req, res) => {
    const { id } = req.params; // character id
    const user = req.user || {};
    const CharacterModel = require('../models/characterModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return res.status(403).json({ message: 'Acesso negado' });

      CharacterModel.deleteById(id, (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: 'Personagem removido' });
      });
    });
  },

  findAll: (req, res) => {
    // if master/admin, return all characters; otherwise return only user's characters
    const user = req.user || {};
    if (user.role === 'master' || user.role === 'admin') {
      CharacterService.getAllCharacters((err, results) => {
        if (err) return res.status(500).json(err);
        return res.json(results);
      });
    } else {
      CharacterService.getCharactersByUser(user.id, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      });
    }
  },

  getFull: (req, res) => {
    const { id } = req.params;
    const user = req.user || {};

    CharacterService.getFullCharacter(id, user, (err, result) => {
      if (err) {
        // 🔥 trata erro corretamente
        if (err.message === 'Acesso negado') {
          return res.status(403).json(err);
        }

        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
,

  update: (req, res) => {
    const { id } = req.params;

  const user = req.user || {};
  const data = req.body;

    // DEBUG: log incoming update payload for troubleshooting patrimonio persistence
    try { console.log('[DEBUG] Character update request', { characterId: id, userId, payload: data }); } catch (e) {}

    CharacterService.updateCharacter(id, user, data, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json(err);
        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
,

  updateBackground: (req, res) => {
    const { id } = req.params; // character id
    const user = req.user || {};
    const payload = req.body || {};

    const CharacterModel = require('../models/characterModel');
    const BackgroundModel = require('../models/backgroundModel');
    const CharacterPhobiaModel = require('../models/characterPhobiaModel');
    const ParanormalModel = require('../models/paranormalModel');

    // validate owner
    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return res.status(403).json({ message: 'Acesso negado' });

      // upsert background
      BackgroundModel.findByCharacterId(id, (err2, bg) => {
        if (err2) return res.status(500).json(err2);

        const doPhobias = (cb) => {
          if (payload.phobias !== undefined) {
            CharacterPhobiaModel.replaceForCharacter(id, payload.phobias || [], cb);
          } else cb(null, { affectedRows: 0 });
        };

        const doEncounters = (cb) => {
          if (payload.paranormal_encounters !== undefined) {
            ParanormalModel.replaceForCharacter(id, payload.paranormal_encounters || [], cb);
          } else cb(null, { affectedRows: 0 });
        };

        if (!bg) {
          BackgroundModel.create(id, payload, (err3) => {
            if (err3) return res.status(500).json(err3);
            // then handle phobias and encounters
            doPhobias((err4) => {
              if (err4) return res.status(500).json(err4);
              doEncounters((err5) => {
                if (err5) return res.status(500).json(err5);
                return res.json({ message: 'Antecedentes criados' });
              });
            });
          });
        } else {
          BackgroundModel.update(id, payload, (err6) => {
            if (err6) return res.status(500).json(err6);
            doPhobias((err7) => {
              if (err7) return res.status(500).json(err7);
              doEncounters((err8) => {
                if (err8) return res.status(500).json(err8);
                return res.json({ message: 'Antecedentes atualizados' });
              });
            });
          });
        }
      });
    });
  }
,

  // Notes CRUD
  getNotes: (req, res) => {
    const { id } = req.params; // character id
    const userId = req.user.id;
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      CharacterNoteModel.findByCharacterId(id, (err2, notes) => {
        if (err2) return res.status(500).json(err2);
        res.json(notes || []);
      });
    });
  },

  getPatrimonio: (req, res) => {
    const { id } = req.params; // character id
    const userId = req.user.id;
    const CharacterModel = require('../models/characterModel');
    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });
      return res.json({ id: character.id, patrimonio: character.patrimonio });
    });
  },

  createNote: (req, res) => {
    const { id } = req.params; // character id
    const userId = req.user.id;
    const payload = req.body || {};
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      CharacterNoteModel.create(id, payload, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        res.status(201).json({ id: result.insertId });
      });
    });
  },

  updateNote: (req, res) => {
    const { id, noteId } = req.params;
    const userId = req.user.id;
    const payload = req.body || {};
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      // ensure note exists and belongs to character
      CharacterNoteModel.findById(noteId, (err2, note) => {
        if (err2) return res.status(500).json(err2);
        if (!note || note.character_id !== Number(id)) return res.status(404).json({ message: 'Nota não encontrada' });

        CharacterNoteModel.update(noteId, payload, (err3) => {
          if (err3) return res.status(500).json(err3);
          res.json({ message: 'Nota atualizada' });
        });
      });
    });
  },

  deleteNote: (req, res) => {
    const { id, noteId } = req.params;
    const userId = req.user.id;
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      CharacterNoteModel.findById(noteId, (err2, note) => {
        if (err2) return res.status(500).json(err2);
        if (!note || note.character_id !== Number(id)) return res.status(404).json({ message: 'Nota não encontrada' });

        CharacterNoteModel.deleteById(noteId, (err3) => {
          if (err3) return res.status(500).json(err3);
          res.json({ message: 'Nota apagada' });
        });
      });
    });
  }
};

module.exports = CharacterController;

// update basic character details (profile/config)
CharacterController.updateDetails = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const payload = req.body || {};

  const CharacterModel = require('../models/characterModel');
  const ClassModel = require('../models/classModel');
  const TrailModel = require('../models/trailModel');
  const OriginModel = require('../models/originModel');

  CharacterModel.findById(id, (err, character) => {
    if (err) return res.status(500).json(err);
    if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
    if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

    // merge provided payload with existing character to avoid setting NOT NULL fields to null
    const mergedPayload = {
      name: payload.name !== undefined ? payload.name : character.name,
      idade: payload.idade !== undefined ? payload.idade : character.idade,
      origem: payload.origem !== undefined ? payload.origem : character.origem,
      origem_id: payload.origem_id !== undefined ? payload.origem_id : character.origem_id,
      classe: payload.classe !== undefined ? payload.classe : character.classe,
      classe_id: payload.classe_id !== undefined ? payload.classe_id : character.classe_id,
      trilha: payload.trilha !== undefined ? payload.trilha : character.trilha,
      trilha_id: payload.trilha_id !== undefined ? payload.trilha_id : character.trilha_id,
      nivel: payload.nivel !== undefined ? payload.nivel : character.nivel,
      nex: payload.nex !== undefined ? payload.nex : character.nex,
      prestigio: payload.prestigio !== undefined ? payload.prestigio : character.prestigio,
      afinidade: payload.afinidade !== undefined ? payload.afinidade : character.afinidade,
      imagem_perfil: payload.imagem_perfil !== undefined ? payload.imagem_perfil : character.imagem_perfil,
      imagem_token: payload.imagem_token !== undefined ? payload.imagem_token : character.imagem_token,
      status_formula: payload.status_formula !== undefined ? payload.status_formula : character.status_formula,
      defense_formula: payload.defense_formula !== undefined ? payload.defense_formula : character.defense_formula
    };

    // validate template ids if provided
    const validateAndUpdate = () => {
      CharacterModel.updateDetails(id, mergedPayload, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        // after updating details, recalculate max stats based on new class/level/formula
        const CharacterService = require('../services/characterService');
        CharacterService.recalculateStatusMax(id, (err3, stats) => {
          if (err3) {
            // log error but still return success for details update
            console.warn('Erro ao recalcular status:', err3 && err3.message ? err3.message : err3);
            return res.json({ message: 'Detalhes atualizados' });
          }
          // return updated fields back to client including computed max stats
          res.json({ message: 'Detalhes atualizados', computed: stats });
        });
      });
    };

    if (payload.classe_id) {
      ClassModel.findById(payload.classe_id, (err3, cls) => {
        if (err3) return res.status(500).json(err3);
        if (!cls) return res.status(400).json({ message: 'Classe inválida' });

        if (payload.trilha_id) {
          TrailModel.findByClassId(payload.classe_id, (err4, trails) => {
            if (err4) return res.status(500).json(err4);
            const found = (trails || []).some(t => t.id === Number(payload.trilha_id));
            if (!found) return res.status(400).json({ message: 'Trilha não pertence à classe selecionada' });
            // origem can be validated separately
            if (payload.origem_id) {
              OriginModel.findById(payload.origem_id, (err5, org) => {
                if (err5) return res.status(500).json(err5);
                if (!org) return res.status(400).json({ message: 'Origem inválida' });
                validateAndUpdate();
              });
            } else validateAndUpdate();
          });
        } else {
          if (payload.origem_id) {
            OriginModel.findById(payload.origem_id, (err6, org) => {
              if (err6) return res.status(500).json(err6);
              if (!org) return res.status(400).json({ message: 'Origem inválida' });
              validateAndUpdate();
            });
          } else validateAndUpdate();
        }
      });
    } else if (payload.trilha_id) {
      // trilha provided but no classe: verify trail exists
      TrailModel.findByClassId(payload.trilha_id, (err7, trails) => {
        // trail validation fallback: if trail doesn't exist by id, return error
        // simpler: attempt to find trail by id in trails table
        const sqlCheck = require('../models/trailModel');
        sqlCheck.findAll((err8, allTrails) => {
          if (err8) return res.status(500).json(err8);
          const found = (allTrails || []).some(t => t.id === Number(payload.trilha_id));
          if (!found) return res.status(400).json({ message: 'Trilha inválida' });
          if (payload.origem_id) {
            OriginModel.findById(payload.origem_id, (err9, org) => {
              if (err9) return res.status(500).json(err9);
              if (!org) return res.status(400).json({ message: 'Origem inválida' });
              validateAndUpdate();
            });
          } else validateAndUpdate();
        });
      });
    } else if (payload.origem_id) {
      OriginModel.findById(payload.origem_id, (err10, org) => {
        if (err10) return res.status(500).json(err10);
        if (!org) return res.status(400).json({ message: 'Origem inválida' });
        validateAndUpdate();
      });
    } else {
      validateAndUpdate();
    }
  });
};