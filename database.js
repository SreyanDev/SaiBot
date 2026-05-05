const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./hero.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Database connected.");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    lastMessage INTEGER DEFAULT 0
  )
`);

module.exports = db;