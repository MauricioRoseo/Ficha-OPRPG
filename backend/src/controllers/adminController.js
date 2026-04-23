const db = require('../config/database');

const AdminController = {
  export: async (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    try {
      // helper to run a query and return rows
      const q = (sql, vals=[]) => new Promise((resolve, reject) => db.query(sql, vals, (err, r) => err ? reject(err) : resolve(r)));

      // fetch all user tables for the current database dynamically
      const tables = await q(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE='BASE TABLE'`);
      const payload = {};

      for (const t of tables) {
        const name = t.TABLE_NAME;
        try {
          const rows = await q(`SELECT * FROM \`${name}\``);
          payload[name] = rows;
        } catch (e) {
          // if a select fails for a specific table, continue but log the issue
          console.debug(`Admin export: failed to select from ${name}`, e && e.message);
          payload[name] = [];
        }
      }

      res.json(payload);
    } catch (err) {
      console.error('Admin export error', err);
      res.status(500).json({ message: 'Erro ao exportar dados', error: err.message });
    }
  },

  import: async (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });

    const data = req.body || {};
    if (!data) return res.status(400).json({ message: 'Nenhum dado fornecido' });

    const q = (sql, vals=[]) => new Promise((resolve, reject) => db.query(sql, vals, (err, r) => err ? reject(err) : resolve(r)));

    // insert rows into table. To preserve relationships across tables we accept and insert explicit ids when present.
    // We run the import with FOREIGN_KEY_CHECKS=0 to avoid ordering issues; errors on single rows are logged and skipped.
    const insertMany = async (table, rows) => {
      if (!rows || !Array.isArray(rows) || rows.length === 0) return { inserted: 0 };
      let inserted = 0;

      // detect JSON columns for this table so we can normalize values before inserting
      let jsonCols = [];
      try {
        const cols = await q(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND DATA_TYPE = 'json'`, [table]);
        jsonCols = (cols || []).map(c => c.COLUMN_NAME);
      } catch (e) {
        jsonCols = [];
      }

      for (const row of rows) {
        try {
          const obj = { ...row };

          // normalize JSON columns: ensure values are valid JSON text (stringify objects, wrap raw strings)
          for (const jc of jsonCols) {
            if (Object.prototype.hasOwnProperty.call(obj, jc)) {
              const v = obj[jc];
              if (v === null || v === undefined) {
                obj[jc] = null;
              } else if (typeof v === 'object') {
                // object/array -> stringify
                try { obj[jc] = JSON.stringify(v); } catch (e) { obj[jc] = null; }
              } else if (typeof v === 'string') {
                // if it's a string, check if it's valid JSON text; if not, stringify the string so it becomes a valid JSON string
                try {
                  JSON.parse(v);
                  // valid JSON text - leave as-is (it's already JSON string like '{"a":1}' or '"text"')
                } catch (e) {
                  // not valid JSON text, convert to a JSON string (so DB receives e.g. '"Invalid value."')
                  obj[jc] = JSON.stringify(v);
                }
              } else {
                // primitive number/boolean -> stringify to JSON text
                try { obj[jc] = JSON.stringify(v); } catch (e) { obj[jc] = null; }
              }
            }
          }

          const keys = Object.keys(obj);
          if (keys.length === 0) continue;
          const values = keys.map(k => obj[k]);
          const placeholders = keys.map(()=>'?').join(', ');
          // use INSERT IGNORE so duplicate primary keys don't abort the whole import
          const sql = `INSERT IGNORE INTO \`${table}\` (${keys.join(',')}) VALUES (${placeholders})`;
          await q(sql, values);
          inserted++;
        } catch (e) {
          console.debug(`Import warning: failed to insert into ${table}`, e && e.message);
        }
      }
      return { inserted };
    };

    try {
      const results = {};

      // disable FK checks to allow importing in any order and to preserve ids/references
      await q('SET FOREIGN_KEY_CHECKS=0');

      // iterate through provided tables and insert rows preserving ids when present
      for (const table of Object.keys(data)) {
        try {
          const rows = data[table];
          results[table] = await insertMany(table, rows);
        } catch (e) {
          console.debug(`Import warning for table ${table}`, e && e.message);
          results[table] = { inserted: 0, error: e && e.message };
        }
      }

      await q('SET FOREIGN_KEY_CHECKS=1');

      res.json({ message: 'Import completed', results });
    } catch (err) {
      console.error('Admin import error', err);
      res.status(500).json({ message: 'Erro ao importar dados', error: err.message });
    }
  }
};

module.exports = AdminController;
