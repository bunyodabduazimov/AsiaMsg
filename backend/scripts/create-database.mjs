import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
});

await connection.query('CREATE DATABASE IF NOT EXISTS `asiamsg`');
await connection.end();

console.log('Database `asiamsg` is ready.');
