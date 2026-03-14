const router = require("express").Router();
const passport = require("passport");
const pool = require("../config/database");
const { genPassword } = require("../lib/passwordUtils");

// ---------------- GET ROUTES ------------------------

router.get("/", (req, res) => {
  res.send(
    '<h1>Home</h1><p><a href="/register">Register</a> or <a href="/login">Login</a></p>',
  );
});

router.get("/login", (req, res) => {
  const form = `
        <h1>Login</h1>
        <form method="POST" action="/login">
            <label>Username</label><br>
            <input type="text" name="username"><br><br>
            <label>Password</label><br>
            <input type="password" name="password"><br><br>
            <input type="submit" value="Login">
        </form>
    `;
  res.send(form);
});

router.get("/register", (req, res) => {
  const form = `
        <h1>Register</h1>
        <form method="POST" action="/register">
            <label>Username</label><br>
            <input type="text" name="username"><br><br>
            <label>Password</label><br>
            <input type="password" name="password"><br><br>
            <input type="submit" value="Register">
        </form>
    `;
  res.send(form);
});

router.get("/protected-route", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(
      `<h1>Welcome ${req.user.username}</h1><p><a href="/logout">Logout</a></p>`,
    );
  } else {
    res.send(
      '<h1>You are not authenticated</h1><p><a href="/login">Login</a></p>',
    );
  }
});

router.get("/login-success", (req, res) => {
  res.send(
    '<p>Logged in successfully. <a href="/protected-route">Go to protected route</a></p>',
  );
});

router.get("/login-failure", (req, res) => {
  res.send('<p>Wrong username or password. <a href="/login">Try again</a></p>');
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/protected-route");
  });
});

// ----------------- POST ROUTES ---------------------

router.post("/register", async (req, res, next) => {
  const { salt, hash } = genPassword(req.body.password);
  try {
    await pool.query(
      "INSERT INTO users (username, hash, salt) VALUES ($1, $2, $3)",
      [req.body.username, hash, salt],
    );
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login-failure",
    successRedirect: "/login-success",
  }),
);

module.exports = router;
