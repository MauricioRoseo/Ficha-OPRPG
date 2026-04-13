const TabModel = require('../models/tabModel');

const TabService = {
  getTabsForCharacter: (characterId, callback) => {
    TabModel.getByCharacter(characterId, callback);
  },

  ensureDefaultTabs: (characterId, callback) => {
    // check if character has any tabs, if not create defaults
    TabModel.getByCharacter(characterId, (err, tabs) => {
      if (err) return callback(err);
      if (tabs && tabs.length > 0) return callback(null, tabs);
      TabModel.createDefaultTabsForCharacter(characterId, (err2) => {
        if (err2) return callback(err2);
        TabModel.getByCharacter(characterId, callback);
      });
    });
  }
};

module.exports = TabService;
