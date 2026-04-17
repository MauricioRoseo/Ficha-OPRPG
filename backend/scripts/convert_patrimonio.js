// Usage: node scripts/convert_patrimonio.js
// This script connects using backend's DB config and ensures `characters.patrimonio` is TEXT.

const db = require('../src/config/database');

function run() {
  const checkSql = `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'patrimonio'`;
  db.query(checkSql, [], (err, results) => {
    if (err) {
      console.error('Erro ao consultar INFORMATION_SCHEMA:', err);
      process.exit(1);
    }
    const dt = results && results[0] && results[0].DATA_TYPE;
    console.log('Current data_type for characters.patrimonio:', dt || '<missing>');
    if (!dt) {
      console.log('Column patrimonio is missing; creating as TEXT...');
      db.query(`ALTER TABLE characters ADD COLUMN patrimonio TEXT DEFAULT NULL`, [], (err2) => {
        if (err2) {
          console.error('Erro ao adicionar coluna patrimonio:', err2);
          process.exit(2);
        }
        console.log('Coluna patrimonio adicionada como TEXT.');
        process.exit(0);
      });
    } else if (dt.toLowerCase() !== 'text') {
      console.log('Altering column to TEXT...');
      db.query(`ALTER TABLE characters MODIFY patrimonio TEXT DEFAULT NULL`, [], (err3) => {
        if (err3) {
          console.error('Erro ao modificar coluna patrimonio:', err3);
          process.exit(3);
        }
        console.log('Coluna patrimonio alterada para TEXT.');
        process.exit(0);
      });
    } else {
      console.log('Patrimonio already TEXT. No action needed.');
      process.exit(0);
    }
  });
}

run();
