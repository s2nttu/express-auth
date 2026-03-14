const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const pool = require("./database");
const { validPassword } = require("../lib/passwordUtils");

/* 
new LocalStrategy(...) - Passport calls this function when a login attempt is made, passing in whatever the user typed. done is a callback you call to tell Passport what happened
*/
passport.use(
  new LocalStrategy(async (username, genPassword, done) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      const user = result.rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" }); // - wrong credentials
      }
      const isValid = validPassword(genPassword, user.hash, user.salt);

      if (!isValid) {
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user); // - success, here's the user
    } catch (err) {
      return done(err); // - something went wrong
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});
