const ProtectionModel = require('../models/protectionModel');
const ResistanceModel = require('../models/resistanceModel');
const FeatureModel = require('../models/featureModel');
const CharacterModel = require('../models/characterModel');
const CharacterService = require('../services/characterService');

// Helper: recompute base passive from formulas, add protectionsSum, persist final value
const computeAndSetPassive = (characterId, protectionsSum, callback) => {
  CharacterService.recalculateStatusMax(characterId, (err, computed) => {
    if (err) {
      // fallback: persist protections sum only
      return CharacterModel.setPassiveDefense(characterId, Number(protectionsSum || 0), (err2) => callback(err2, Number(protectionsSum || 0)));
    }

    const basePassive = Number((computed && computed.defesa_passiva) || 0);
    const finalPassive = Math.max(0, basePassive + Number(protectionsSum || 0));
    CharacterModel.setPassiveDefense(characterId, finalPassive, (err2) => callback(err2, finalPassive));
  });
};

const ProtectionController = {
  update: (req, res) => {
    const { id } = req.params;
    const data = req.body;

    ProtectionModel.findById(id, (err, protection) => {
      if (err) return res.status(500).json(err);
      if (!protection) return res.status(404).json({ message: 'Proteção não encontrada' });

      CharacterModel.findById(protection.character_id, (err2, character) => {
        if (err2) return res.status(500).json(err2);
        if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
        if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

        ProtectionModel.update(id, data, (err3) => {
          if (err3) return res.status(500).json(err3);

          ProtectionModel.findByCharacterId(protection.character_id, (err4, protections) => {
            if (err4) return res.status(500).json(err4);
            const protectionsSum = (protections || []).filter(p => p.equipped == 1).reduce((acc, p) => acc + (Number(p.passive_defense) || 0), 0);

            computeAndSetPassive(protection.character_id, protectionsSum, (err5, finalPassive) => {
              if (err5) return res.status(500).json(err5);

              // apply/remove encumbrance and resistances if equipped state changed
              try {
                const prevEquipped = protection.equipped ? 1 : 0;
                const newEquipped = (data.equipped !== undefined) ? (data.equipped ? 1 : 0) : prevEquipped;
                const dr = Number(protection.damage_resistance || 0);
                const enc = Number(protection.encumbrance_penalty || 0);
                const deltaRes = (newEquipped - prevEquipped) * dr;
                const deltaEnc = (newEquipped - prevEquipped) * enc;

                const finish = () => {
                  if (deltaRes !== 0) {
                    ResistanceModel.findByCharacterId(protection.character_id, (errR, resistances) => {
                      if (errR) return res.status(500).json(errR);
                      return res.json({ message: 'Proteção atualizada', defesa_passiva: finalPassive, resistances });
                    });
                    return;
                  }
                  return res.json({ message: 'Proteção atualizada', defesa_passiva: finalPassive });
                };

                if (deltaEnc !== 0) {
                  FeatureModel.incrementEncumbranceForCharacter(protection.character_id, deltaEnc, (err6) => {
                    if (err6) return res.status(500).json(err6);
                    if (deltaRes !== 0) {
                      ResistanceModel.incrementPhysical(protection.character_id, deltaRes, (err7) => {
                        if (err7) return res.status(500).json(err7);
                        finish();
                      });
                      return;
                    }
                    finish();
                  });
                  return;
                }

                if (deltaRes !== 0) {
                  ResistanceModel.incrementPhysical(protection.character_id, deltaRes, (err6) => {
                    if (err6) return res.status(500).json(err6);
                    ResistanceModel.findByCharacterId(protection.character_id, (err7, resistances) => {
                      if (err7) return res.status(500).json(err7);
                      return res.json({ message: 'Proteção atualizada', defesa_passiva: finalPassive, resistances });
                    });
                  });
                  return;
                }

                return res.json({ message: 'Proteção atualizada', defesa_passiva: finalPassive });
              } catch (e) {
                console.error('Erro ao atualizar resistências/penalidades:', e);
                return res.json({ message: 'Proteção atualizada', defesa_passiva: finalPassive });
              }
            });
          });
        });
      });
    });
  },

  create: (req, res) => {
    const data = req.body;
    if (!data.character_id || !data.name) return res.status(400).json({ message: 'character_id e name são obrigatórios' });

    CharacterModel.findById(data.character_id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

      ProtectionModel.create(data, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        ProtectionModel.findById(result.insertId, (err3, created) => {
          if (err3) return res.status(500).json(err3);
          ProtectionModel.findByCharacterId(created.character_id, (err4, protections) => {
            if (err4) return res.status(500).json(err4);
            const protectionsSum = (protections || []).filter(p => p.equipped == 1).reduce((acc, p) => acc + (Number(p.passive_defense) || 0), 0);

            computeAndSetPassive(created.character_id, protectionsSum, (err5, finalPassive) => {
              if (err5) return res.status(500).json(err5);

              // if created was equipped, apply its resistance/encumbrance
              try {
                const dr = Number(created.damage_resistance || 0);
                const enc = Number(created.encumbrance_penalty || 0);
                const applyBoth = ((created.equipped ? 1 : 0) === 1) && (dr !== 0 || enc !== 0);
                if (applyBoth) {
                  if (enc !== 0) {
                    FeatureModel.incrementEncumbranceForCharacter(created.character_id, enc, (err6) => {
                      if (err6) return res.status(500).json(err6);
                      if (dr !== 0) {
                        ResistanceModel.incrementPhysical(created.character_id, dr, (err7) => {
                          if (err7) return res.status(500).json(err7);
                          ResistanceModel.findByCharacterId(created.character_id, (err8, resistances) => {
                            if (err8) return res.status(500).json(err8);
                            return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                          });
                        });
                        return;
                      }

                      ResistanceModel.findByCharacterId(created.character_id, (err7, resistances) => {
                        if (err7) return res.status(500).json(err7);
                        return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                      });
                    });
                    return;
                  }

                  if (dr !== 0) {
                    ResistanceModel.incrementPhysical(created.character_id, dr, (err6) => {
                      if (err6) return res.status(500).json(err6);
                      ResistanceModel.findByCharacterId(created.character_id, (err7, resistances) => {
                        if (err7) return res.status(500).json(err7);
                        return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                      });
                    });
                    return;
                  }
                }
              } catch (e) {
                console.error('Erro ao aplicar resistência/penalidade após criar proteção:', e);
              }

              return res.status(201).json({ protection: created, defesa_passiva: finalPassive });
            });
          });
        });
      });
    });
  },

  createFromTemplate: (req, res) => {
    const { template_id, character_id, overrides } = req.body;
    if (!template_id || !character_id) return res.status(400).json({ message: 'template_id e character_id são obrigatórios' });

    CharacterModel.findById(character_id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

      const TemplateModel = require('../models/protectionTemplateModel');
      TemplateModel.findById(template_id, (err2, templateRow) => {
        if (err2) return res.status(500).json(err2);
        if (!templateRow) return res.status(404).json({ message: 'Template não encontrado' });

        ProtectionModel.createFromTemplate(templateRow, character_id, overrides || {}, (err3, result) => {
          if (err3) return res.status(500).json(err3);
          ProtectionModel.findById(result.insertId, (err4, created) => {
            if (err4) return res.status(500).json(err4);
            ProtectionModel.findByCharacterId(character_id, (err5, protections) => {
              if (err5) return res.status(500).json(err5);
              const protectionsSum = (protections || []).filter(p => p.equipped == 1).reduce((acc, p) => acc + (Number(p.passive_defense) || 0), 0);

              computeAndSetPassive(character_id, protectionsSum, (err6, finalPassive) => {
                if (err6) return res.status(500).json(err6);

                try {
                  const dr = Number(created.damage_resistance || 0);
                  const enc = Number(created.encumbrance_penalty || 0);
                  const applyBoth = ((created.equipped ? 1 : 0) === 1) && (dr !== 0 || enc !== 0);
                  if (applyBoth) {
                    if (enc !== 0) {
                      FeatureModel.incrementEncumbranceForCharacter(created.character_id, enc, (err7) => {
                        if (err7) return res.status(500).json(err7);
                        if (dr !== 0) {
                          ResistanceModel.incrementPhysical(created.character_id, dr, (err8) => {
                            if (err8) return res.status(500).json(err8);
                            ResistanceModel.findByCharacterId(created.character_id, (err9, resistances) => {
                              if (err9) return res.status(500).json(err9);
                              return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                            });
                          });
                          return;
                        }

                        ResistanceModel.findByCharacterId(created.character_id, (err8, resistances) => {
                          if (err8) return res.status(500).json(err8);
                          return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                        });
                      });
                      return;
                    }

                    if (dr !== 0) {
                      ResistanceModel.incrementPhysical(created.character_id, dr, (err7) => {
                        if (err7) return res.status(500).json(err7);
                        ResistanceModel.findByCharacterId(created.character_id, (err8, resistances) => {
                          if (err8) return res.status(500).json(err8);
                          return res.status(201).json({ protection: created, defesa_passiva: finalPassive, resistances });
                        });
                      });
                      return;
                    }
                  }
                } catch (e) {
                  console.error('Erro ao aplicar resistência/penalidade após criar proteção do template:', e);
                }

                return res.status(201).json({ protection: created, defesa_passiva: finalPassive });
              });
            });
          });
        });
      });
    });
  },

  remove: (req, res) => {
    const { id } = req.params;

    ProtectionModel.findById(id, (err, protection) => {
      if (err) return res.status(500).json(err);
      if (!protection) return res.status(404).json({ message: 'Proteção não encontrada' });

      CharacterModel.findById(protection.character_id, (err2, character) => {
        if (err2) return res.status(500).json(err2);
        if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
        if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

        ProtectionModel.deleteById(id, (err3) => {
          if (err3) return res.status(500).json(err3);

          ProtectionModel.findByCharacterId(protection.character_id, (err4, protections) => {
            if (err4) return res.status(500).json(err4);
            const protectionsSum = (protections || []).filter(p => p.equipped == 1).reduce((acc, p) => acc + (Number(p.passive_defense) || 0), 0);

            computeAndSetPassive(protection.character_id, protectionsSum, (err5, finalPassive) => {
              if (err5) return res.status(500).json(err5);

              try {
                if (protection.equipped) {
                  const dr = Number(protection.damage_resistance || 0);
                  const enc = Number(protection.encumbrance_penalty || 0);
                  if (enc !== 0) {
                    FeatureModel.incrementEncumbranceForCharacter(protection.character_id, -enc, (err6) => {
                      if (err6) return res.status(500).json(err6);
                      if (dr !== 0) {
                        ResistanceModel.incrementPhysical(protection.character_id, -dr, (err7) => {
                          if (err7) return res.status(500).json(err7);
                          ResistanceModel.findByCharacterId(protection.character_id, (err8, resistances) => {
                            if (err8) return res.status(500).json(err8);
                            return res.json({ message: 'Proteção removida', defesa_passiva: finalPassive, resistances });
                          });
                        });
                        return;
                      }

                      ResistanceModel.findByCharacterId(protection.character_id, (err7, resistances) => {
                        if (err7) return res.status(500).json(err7);
                        return res.json({ message: 'Proteção removida', defesa_passiva: finalPassive, resistances });
                      });
                    });
                    return;
                  }

                  if (dr !== 0) {
                    ResistanceModel.incrementPhysical(protection.character_id, -dr, (err6) => {
                      if (err6) return res.status(500).json(err6);
                      ResistanceModel.findByCharacterId(protection.character_id, (err7, resistances) => {
                        if (err7) return res.status(500).json(err7);
                        return res.json({ message: 'Proteção removida', defesa_passiva: finalPassive, resistances });
                      });
                    });
                    return;
                  }
                }
              } catch (e) {
                console.error('Erro ao ajustar resistencias após remover proteção', e);
              }

              return res.json({ message: 'Proteção removida', defesa_passiva: finalPassive });
            });
          });
        });
      });
    });
  }
};

module.exports = ProtectionController;
