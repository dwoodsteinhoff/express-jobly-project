"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    user: 'darewood',
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    user: 'darewood',
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: getDatabaseUri(),
  });
}

db.connect();

module.exports = db;