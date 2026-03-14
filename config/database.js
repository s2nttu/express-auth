const { Pool } = require("pg");
require("dotenv").config();

/* 
A connection pool means pg opens several database connections and keeps them ready rather than opening and closing one every time you run a query. When your app needs to query the database, it borrows a connection from the pool, uses it, then returns it. Much more efficient.
*/
const pool = new Pool({
  // reads the value from your .env file.
  connectionString: process.env.DB_STRING,
});

/*
SELECT NOW() is just a throwaway query to confirm the connection works — it asks Postgres for the current time. 
*/
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected at: ", res.rows[0].now);
  }
});

module.exports = pool;
