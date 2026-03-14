# Express Authentication with Passport + PostgreSQL

A reference guide for building local username/password authentication using Express, Passport.js, PostgreSQL, and sessions. Built from scratch as a learning project.

---

## Stack

- **Express** — web server and middleware pipeline
- **pg** — PostgreSQL driver (connection pool)
- **express-session** — session management
- **connect-pg-simple** — stores sessions in PostgreSQL
- **passport + passport-local** — authentication middleware
- **crypto** (built-in Node module) — password hashing, no extra install needed
- **dotenv** — loads environment variables from `.env`

---

## Project Structure

```
express-auth/
├── config/
│   ├── database.js       # PostgreSQL connection pool
│   └── passport.js       # Passport strategy + serialize/deserialize
├── lib/
│   └── passwordUtils.js  # genPassword and validPassword functions
├── routes/
│   └── index.js          # All app routes
├── app.js                # Server setup, middleware, session, passport
└── .env                  # Environment variables (never commit this)
```

---

## Environment Variables

Create a `.env` file in the root with:

```
DB_STRING=postgresql://localhost:5432/your_db_name
SECRET=some_long_random_string
```

- `DB_STRING` — your PostgreSQL connection string
- `SECRET` — used to sign the session cookie. Keep this private.

---

## Database Setup

You need two tables in PostgreSQL.

**Users table** — stores registered users:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL
);
```

**Session table** — stores active sessions (created from connect-pg-simple):

```bash
psql your_db_name < node_modules/connect-pg-simple/table.sql
```

---

## How Passwords Work

Passwords are never stored in plain text. Instead, two values are stored per user: a **salt** and a **hash**.

**Registration:**

1. A random 32-byte **salt** is generated for this user
2. The salt is combined with the password and run through `pbkdf2` 10,000 times
3. The resulting **hash** and the **salt** are stored in the database

**Login:**

1. The salt is fetched from the database for the given username
2. The same `pbkdf2` process is run with the submitted password and that salt
3. If the result matches the stored hash — the password is correct

The salt means two users with the same password will have completely different hashes, defeating precomputed attack tables.

---

## How Sessions Work

HTTP is stateless — the server has no memory of previous requests. Sessions solve this.

1. When a user logs in, the server creates a **session record** in the `session` table
2. The server sends the browser a **cookie** containing just the session ID
3. On every subsequent request, the browser sends the cookie back
4. The server looks up the session ID in PostgreSQL and knows who the user is
5. The `SECRET` in `.env` is used to cryptographically sign the cookie so it cannot be tampered with

Session options used in this app:

- `resave: false` — don't re-save session if nothing changed
- `saveUninitialized: false` — don't create a session until the user logs in
- `cookie: { maxAge: 30 days }` — session lasts 30 days

---

## How Passport Works

Passport is authentication middleware. It sits in the pipeline and handles verifying credentials and tying the result to the session.

**The LocalStrategy** — defined in `config/passport.js`. When a login attempt is made, Passport calls this function with the submitted username and password. It queries the database, runs `validPassword`, and calls `done()` with the result:

- `done(null, user)` — success
- `done(null, false)` — wrong credentials
- `done(err)` — something went wrong server-side

**serializeUser** — called once after a successful login. Decides what to store in the session. Only the user's `id` is stored — not the whole user object.

**deserializeUser** — called on every subsequent request. Takes the stored `id` from the session, queries the database for the full user, and attaches it to `req.user`. This is how `req.user` is available in your routes.

**Middleware order in app.js matters:**

```
express.json / express.urlencoded  ← parse request bodies
express-session                    ← session must be set up first
passport.initialize()              ← then passport
passport.session()                 ← passport reads from the session
routes                             ← finally your routes
```

---

## Login Flow — End to End

```
1. User submits login form (POST /login)
        ↓
2. passport.authenticate('local') is called
        ↓
3. LocalStrategy runs:
   - Queries database for username
   - Runs validPassword(password, hash, salt)
        ↓
4. If valid → serializeUser stores user.id in the session
        ↓
5. Session record saved to PostgreSQL session table
   Cookie with session ID sent to browser
        ↓
6. User redirected to /login-success
        ↓
7. On next request (e.g. /protected-route):
   - Browser sends cookie
   - deserializeUser fetches full user from DB using stored id
   - req.user is available
   - req.isAuthenticated() returns true
```

---

## Registration Flow — End to End

```
1. User submits register form (POST /register)
        ↓
2. genPassword(password) called
   - Random salt generated
   - Hash computed from password + salt
        ↓
3. username, hash, salt inserted into users table
        ↓
4. User redirected to /login
```

---

## Routes

| Method | Path               | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/`                | Home page                              |
| GET    | `/register`        | Registration form                      |
| POST   | `/register`        | Creates new user in database           |
| GET    | `/login`           | Login form                             |
| POST   | `/login`           | Authenticates user via Passport        |
| GET    | `/logout`          | Logs user out, clears session          |
| GET    | `/protected-route` | Example of a protected route           |
| GET    | `/login-success`   | Redirect target after successful login |
| GET    | `/login-failure`   | Redirect target after failed login     |

### Protecting a Route

```js
router.get("/protected-route", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Welcome ${req.user.username}`);
  } else {
    res.redirect("/login");
  }
});
```

To avoid repeating this check, turn it into reusable middleware:

```js
function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Then use it on any route:
router.get("/dashboard", isAuth, (req, res) => {
  res.send("Protected dashboard");
});
```

---

## Install and Run

```bash
npm install
node app.js
```

Server runs at `http://localhost:3000`

---

## Key Things to Remember for Future Projects

- **Never store plain passwords** — always hash with a salt
- **Sessions need to be set up before Passport** — order in app.js matters
- **`.env` goes in `.gitignore`** — never commit credentials
- **`req.user`** is available on any route after login thanks to `deserializeUser`
- **`req.isAuthenticated()`** is the standard way to check login status
- **Parameterised queries** (`$1`, `$2`) protect against SQL injection — never concatenate user input into SQL strings
- The session store must use a persistent database (not memory) in any real app — memory store is wiped on every server restart
