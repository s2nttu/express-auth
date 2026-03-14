const express = require("express");
const pool = require("./config/database");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("<h1>Home</h1>");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
