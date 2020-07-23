const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  const sql =
    "SELECT id, naam, bijnaam, rol, is_actief, verkoper_id FROM gebruikers WHERE verkoper_id = ? && is_actief = 1";

  pool.query(sql, [req.user.zoekGebruiker.verkoper_id], (err, results) => {
    if (err) console.log(err);
    else {
      res.send(results);
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  bcrypt.hash(req.body.wachtwoord, 10, function (err, hash) {
    if (err) {
      throw err;
    }
    const sql1 = `SELECT COUNT(*) "aantal" FROM gebruikers WHERE naam = UPPER(?)`;

    const sql2 =
      "INSERT INTO gebruikers(naam, bijnaam, wachtwoord, rol, is_actief, verkoper_id) VALUES (?,?,?,?,?,?)";

    pool.query(sql1, [req.body.naam], (err, result) => {
      if (err) console.log(err);
      else if (result[0].aantal >= 1) {
        res.status(400).json({
          msg: "Gebruiker bestaat al",
        });
      } else {
        pool.query(
          sql2,
          // hier checken of verkoper id al bestaat
          [
            req.body.naam,
            req.body.bijnaam,
            hash,
            req.body.rol,
            1,
            req.user.zoekGebruiker.verkoper_id,
          ],
          (err, results) => {
            if (err) console.log(err);
            else {
              res.status(200).json({
                msg: "Gebruiker is aangemaakt",
              });
            }
          }
        );
      }
    });
  });
});

router.put("/:id", verifyToken, (req, res) => {
  bcrypt.hash(req.body.wachtwoord, 10, function (err, hash) {
    if (err) {
      throw err;
    }
    const sql =
      "UPDATE gebruikers SET bijnaam=?,wachtwoord=?,rol=?,is_actief=? WHERE id =?";

    pool.query(
      sql,
      [req.body.bijnaam, hash, req.body.rol, req.body.is_actief, req.params.id],
      (err, result) => {
        if (err) console.log(err);
        else {
          res.send(result);
        }
      }
    );
  });
});

module.exports = router;
