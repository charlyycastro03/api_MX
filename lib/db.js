import mysql from 'mysql2/promise';

let pool;

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Leoluis03',
  database: process.env.DB_NAME || 'api_mx',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.NODE_ENV === 'production') {
  pool = mysql.createPool(config);
} else {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool(config);
  }
  pool = global._mysqlPool;
}

export default pool;
