require('dotenv').config();

const DB_TYPES = ['mysql', 'sqlite3', 'postgresql', 'mssql'];

function getDbType() {
  // domyślnie mysql, można zmienić przez zmienną środowiskową DB_TYPE
  return (process.env.DB_TYPE || 'mysql').toLowerCase();
}

function getDbConfig() {
  const dbType = getDbType();
  if (dbType === 'mysql') {
    return {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      table: process.env.MYSQL_TABLE
    };
  }
  // Można rozszerzyć o inne bazy
  throw new Error('Obsługiwany tylko MySQL (na ten moment)');
}

module.exports = {
  getDbType,
  getDbConfig,
  DB_TYPES
};
