const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const pool = require("./config/database");
const routes = require("./routes");

require("dotenv").config();
require("./config/passport");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    /* 
    store - where to save sessions. Without this, sessions are stored in memory which is wiped every time the server restarts. Using Postgres means sessions survive restarts

    */
    store: new pgSession({
      pool: pool,
      tableName: "session",
    }),
    //secret - used to sign the cookie. Keep this private, never commit to GitHub
    secret: process.env.SECRET,
    //resave: false - don't re-save the session on every request if nothing changed
    resave: false,
    //saveUnitialized: fasle - don't create a session until something is actually stored in it (i.e. after login)
    saveUninitialized: false,
    //cookie: {maxAge: ...} - how long the cookie lasts. This is 30 days in milliseconds
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  }),
);

// Test that the session persists between requests
// app.get("/test-session", (req, res) => {
//   if (req.session.views) {
//     req.session.views++;
//   } else {
//     req.session.views = 1;
//   }
//   res.send(`You have visited this page ${req.session.views} time(s)`);
// });

/*
passport.initialize() and passport.session() must come after the session middleware. Passport relies on the session already being set up
*/

app.use(passport.initialize());
app.use(passport.session());

//route for testing
// app.get("/", (req, res) => {
//   res.send("<h1>Home</h1>");
// });
app.use(routes);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
