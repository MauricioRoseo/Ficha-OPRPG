const LayoutModel = require('../models/layoutModel');

const LayoutService = {
  createLayout: (data, callback) => {
    LayoutModel.create(data, callback);
  },

  updateLayout: (id, data, user, callback) => {
    // only owner or admin/master can update
    LayoutModel.findById(id, (err, layout) => {
      if (err) return callback(err);
      if (!layout) return callback(new Error('Layout não encontrado'));
      if (layout.created_by !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return callback(new Error('Acesso negado'));

      LayoutModel.update(id, data, callback);
    });
  },

  deleteLayout: (id, user, callback) => {
    LayoutModel.findById(id, (err, layout) => {
      if (err) return callback(err);
      if (!layout) return callback(new Error('Layout não encontrado'));
      if (layout.created_by !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return callback(new Error('Acesso negado'));

      LayoutModel.remove(id, callback);
    });
  },

  addCharacterToLayout: (layoutId, characterId, user, callback) => {
    // only owner/admin can modify
    LayoutModel.findById(layoutId, (err, layout) => {
      if (err) return callback(err);
      if (!layout) return callback(new Error('Layout não encontrado'));
      if (layout.created_by !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return callback(new Error('Acesso negado'));

      LayoutModel.addCharacter(layoutId, characterId, null, callback);
    });
  },

  removeCharacterFromLayout: (layoutId, characterId, user, callback) => {
    LayoutModel.findById(layoutId, (err, layout) => {
      if (err) return callback(err);
      if (!layout) return callback(new Error('Layout não encontrado'));
      if (layout.created_by !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return callback(new Error('Acesso negado'));

      LayoutModel.removeCharacter(layoutId, characterId, callback);
    });
  },

  getLayoutWithCharacters: (slugOrId, callback) => {
    const fetch = (layout) => {
      LayoutModel.getCharactersForLayout(layout.id, (err, chars) => {
        if (err) return callback(err);
        callback(null, { layout, characters: chars || [] });
      });
    };

    // Try slug search first
    LayoutModel.findBySlug(slugOrId, (err, layout) => {
      if (err) return callback(err);
      if (layout) return fetch(layout);

      // fallback: if slugOrId looks numeric, try findById
      if (/^\d+$/.test(String(slugOrId))) {
        LayoutModel.findById(Number(slugOrId), (err2, layout2) => {
          if (err2) return callback(err2);
          if (!layout2) return callback(new Error('Layout não encontrado'));
          return fetch(layout2);
        });
      } else {
        return callback(new Error('Layout não encontrado'));
      }
    });
  },

  getByCreator: (creatorId, callback) => {
    LayoutModel.getByCreator(creatorId, callback);
  }
};

module.exports = LayoutService;
