const crypto = require("crypto");

function genPassword(password) {
  /* generates 32 random bytes and converts them to a hex string — this is your salt. It's different every time.
  pbkdg2sync is the hashing function. The arguments are:
  password - what the user typed
  salt - the random string unique to this user
  10000 - how many times to run the hash (more iterations = harder to crack)
  64 - the length of the output in bytes
  sha512 - the hashing algorithm
  */
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
}

/*
runs the same process as getPassword with the stored salt and compares the result to the stored hash. If they match, the password is correct
*/
function validPassword(password, hash, salt) {
  const checkHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return checkHash === hash;
}

//testing hashing / salting
// const testResult = genPassword("mypassword123");
// console.log(testResult);
// console.log(validPassword("mypassword123", testResult.hash, testResult.salt));
// console.log(validPassword("wrongpassword", testResult.hash, testResult.salt));

module.exports = { genPassword, validPassword };
