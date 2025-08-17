const mysql = require('mysql2/promise');
const { getDbType, getDbConfig } = require('./dbConfig');

class DB {
  constructor() {
    this.dbType = getDbType();
    this.config = getDbConfig();
    this.connection = null;
  }

  async connect() {
    if (this.dbType === 'mysql') {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database
      });
    } else {
      throw new Error('Obsługiwany tylko MySQL (na ten moment)');
    }
  }

  async insertMetals(metalsArr) {
    if (!this.connection) await this.connect();
    const table = this.config.table;
    // Zakładamy, że kolumny w tabeli odpowiadają kluczom w obiekcie metalsArr
    for (const metal of metalsArr) {
      const keys = Object.keys(metal);
      const values = keys.map(k => metal[k]);
      const placeholders = keys.map(() => '?').join(',');
      const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${placeholders})`;
      await this.connection.execute(sql, values);
    }
  }

  async close() {
    if (this.connection) await this.connection.end();
  }
}

module.exports = DB;
