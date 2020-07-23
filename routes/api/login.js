const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../../database/config");

// Get the token
router.post("/", (req, res) => {
  const gebruiker = req.body;
  let zoekGebruiker = null;

  const sql = `SELECT * FROM gebruikers WHERE UPPER(naam) = UPPER(?)`;

  pool.query(sql, [gebruiker.naam], (err, result) => {
    if (err) console.log(err);
    else {
      zoekGebruiker = result[0];

      if (zoekGebruiker == null) {
        res.status(401).json({
          msg: "Gebruiker niet gevonden",
        });
      } else {

        bcrypt.compare(
          gebruiker.wachtwoord,
          zoekGebruiker.wachtwoord,
          function (err, result) {
            if (err) {
              throw err;
            }
            if (!result) {
              return res.status(401).json({
                title: "login failed",
                msg: "Invalid credentials",
              });
            } else {
              const ONE_WEEK = 60 * 60 * 24 * 7;
              const token = jwt.sign({ zoekGebruiker }, "my_secret_key", {
                expiresIn: ONE_WEEK,
              });
              res.json({
                user: zoekGebruiker,
                token: token,
              });
            }
          }
        );
        /*
        if (
          !bcrypt.compareSync(gebruiker.wachtwoord, zoekGebruiker.wachtwoord)
        ) {
          return res.status(401).json({
            title: "login failed",
            msg: "Invalid credentials",
          });
        } else {
          console.log(req.body);
          const user = { id: 3 };
          const token = jwt.sign({ user }, "my_secret_key");
          res.json({
            user: user,
            token: token,
          });
        }
        */
      }
    }
  });
});

module.exports = router;
