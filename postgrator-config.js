const { DB_URL } = require('./src/config');

require('dotenv').config();
/*eslint-disable*/
console.log(process.env.DB_URL);
console.log(TEST_DB_URL)

module.exports ={
  "migrationsDirectory" : "migrations",
  "driver" : "pg",
  "connectionString" : (process.env.NODE_ENV === 'test')
    ? process.env.TEST_DB_URL
    : process.env.DB_URL ,
};