const InventoryModel = require('../models/inventoryModel');
const CharacterModel = require('../models/characterModel');
const AttributeModel = require('../models/attributeModel');

const InventoryController = {
  listByCharacter: (req, res) => {
    const { characterId } = req.params;
    InventoryModel.findByCharacterId(characterId, (err, items) => {
      if (err) return res.status(500).json(err);
      res.json(items || []);
    });
  },

  create: (req, res) => {
    const data = req.body;
    if (!data.character_id || !data.name) return res.status(400).json({ message: 'character_id e name são obrigatórios' });

    CharacterModel.findById(data.character_id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

      InventoryModel.create(data, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        InventoryModel.findByCharacterId(data.character_id, (err3, items) => {
          if (err3) return res.status(500).json(err3);
          // recompute carga
          const cargaAtual = (items || []).reduce((acc, it) => acc + (Number(it.space) || 0), 0);
          AttributeModel.findByCharacterId(data.character_id, (err4, attrs) => {
            if (err4) return res.status(500).json(err4);
            const a = (attrs && attrs[0]) || { forca: 0 };
            // compute cargaMax using optional status_formula from character
            let cargaMax = 0;
            try {
              let formula = character.status_formula || null;
              if (typeof formula === 'string' && formula.length) {
                formula = JSON.parse(formula);
              }

              const baseAttr = (formula && formula.base_attribute) ? formula.base_attribute : 'forca';
              const extraAttr = (formula && formula.extra_attribute) ? formula.extra_attribute : null;

              const baseVal = Number(a[baseAttr] || 0);
              const extraVal = extraAttr ? Number(a[extraAttr] || 0) : 0;
              const sum = baseVal + extraVal;

              const sumModifiers = (mods) => { if (!mods || !Array.isArray(mods)) return 0; return mods.reduce((s,m)=>s + (Number(m && m.value) || 0), 0); };
              const mods = sumModifiers((formula && formula.modifiers) || []);

              cargaMax = (sum > 0) ? ((sum * 5) + mods) : 0;
            } catch (e) {
              cargaMax = (Number(a.forca) > 0) ? (Number(a.forca) * 5) : 2;
            }
            CharacterModel.setCarga(data.character_id, cargaAtual, cargaMax, (err5) => {
              if (err5) return res.status(500).json(err5);
              InventoryModel.findById(result.insertId, (err6, created) => {
                if (err6) return res.status(500).json(err6);
                res.status(201).json({ item: created, carga_atual: cargaAtual, carga_maxima: cargaMax });
              });
            });
          });
        });
      });
    });
  },

  update: (req, res) => {
    const { id } = req.params;
    const data = req.body;

    InventoryModel.findById(id, (err, item) => {
      if (err) return res.status(500).json(err);
      if (!item) return res.status(404).json({ message: 'Item não encontrado' });
      CharacterModel.findById(item.character_id, (err2, character) => {
        if (err2) return res.status(500).json(err2);
        if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
        if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

        InventoryModel.update(id, data, (err3) => {
          if (err3) return res.status(500).json(err3);
          InventoryModel.findByCharacterId(item.character_id, (err4, items) => {
            if (err4) return res.status(500).json(err4);
            const cargaAtual = (items || []).reduce((acc, it) => acc + (Number(it.space) || 0), 0);
            AttributeModel.findByCharacterId(item.character_id, (err5, attrs) => {
              if (err5) return res.status(500).json(err5);
              const a = (attrs && attrs[0]) || { forca: 0 };
              // compute cargaMax using optional status_formula from character
              let cargaMax = 0;
              try {
                let formula = character.status_formula || null;
                if (typeof formula === 'string' && formula.length) {
                  formula = JSON.parse(formula);
                }

                const baseAttr = (formula && formula.base_attribute) ? formula.base_attribute : 'forca';
                const extraAttr = (formula && formula.extra_attribute) ? formula.extra_attribute : null;

                const baseVal = Number(a[baseAttr] || 0);
                const extraVal = extraAttr ? Number(a[extraAttr] || 0) : 0;
                const sum = baseVal + extraVal;

                const sumModifiers = (mods) => { if (!mods || !Array.isArray(mods)) return 0; return mods.reduce((s,m)=>s + (Number(m && m.value) || 0), 0); };
                const mods = sumModifiers((formula && formula.modifiers) || []);

                cargaMax = (sum > 0) ? ((sum * 5) + mods) : 0;
              } catch (e) {
                cargaMax = (Number(a.forca) > 0) ? (Number(a.forca) * 5) : 2;
              }
              CharacterModel.setCarga(item.character_id, cargaAtual, cargaMax, (err6) => {
                if (err6) return res.status(500).json(err6);
                InventoryModel.findById(id, (err7, updated) => {
                  if (err7) return res.status(500).json(err7);
                  res.json({ item: updated, carga_atual: cargaAtual, carga_maxima: cargaMax });
                });
              });
            });
          });
        });
      });
    });
  },

  remove: (req, res) => {
    const { id } = req.params;
    InventoryModel.findById(id, (err, item) => {
      if (err) return res.status(500).json(err);
      if (!item) return res.status(404).json({ message: 'Item não encontrado' });
      CharacterModel.findById(item.character_id, (err2, character) => {
        if (err2) return res.status(500).json(err2);
        if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
        if (!req.user || character.user_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

        InventoryModel.deleteById(id, (err3) => {
          if (err3) return res.status(500).json(err3);
          InventoryModel.findByCharacterId(item.character_id, (err4, items) => {
            if (err4) return res.status(500).json(err4);
            const cargaAtual = (items || []).reduce((acc, it) => acc + (Number(it.space) || 0), 0);
            AttributeModel.findByCharacterId(item.character_id, (err5, attrs) => {
              if (err5) return res.status(500).json(err5);
              const a = (attrs && attrs[0]) || { forca: 0 };
              // compute cargaMax using optional status_formula from character
              let cargaMax = 0;
              try {
                let formula = character.status_formula || null;
                if (typeof formula === 'string' && formula.length) {
                  formula = JSON.parse(formula);
                }

                const baseAttr = (formula && formula.base_attribute) ? formula.base_attribute : 'forca';
                const extraAttr = (formula && formula.extra_attribute) ? formula.extra_attribute : null;

                const baseVal = Number(a[baseAttr] || 0);
                const extraVal = extraAttr ? Number(a[extraAttr] || 0) : 0;
                const sum = baseVal + extraVal;

                const sumModifiers = (mods) => { if (!mods || !Array.isArray(mods)) return 0; return mods.reduce((s,m)=>s + (Number(m && m.value) || 0), 0); };
                const mods = sumModifiers((formula && formula.modifiers) || []);

                cargaMax = (sum > 0) ? ((sum * 5) + mods) : 0;
              } catch (e) {
                cargaMax = (Number(a.forca) > 0) ? (Number(a.forca) * 5) : 2;
              }
              CharacterModel.setCarga(item.character_id, cargaAtual, cargaMax, (err6) => {
                if (err6) return res.status(500).json(err6);
                res.json({ message: 'Item removido', carga_atual: cargaAtual, carga_maxima: cargaMax });
              });
            });
          });
        });
      });
    });
  }
};

module.exports = InventoryController;
