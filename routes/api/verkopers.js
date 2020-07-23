const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  const sql = `SELECT verkopers.id "id", verkopers.naam "naam", verkopers.extra_naam "extra_naam", verkopers.adres_id "adres_id", verkopers.telefoon "telefoon", verkopers.email "email", verkopers.btw_nr "btw_nr", verkopers.bank "bank", verkopers.extra_bank "extra_bank", verkopers.laatste_update "laatste_update", gebruikers.id "g_id", gebruikers.naam "g_naam", adressen.straat "straat", adressen.postcode "postcode", adressen.gemeente "gemeente", adressen.land "land", adressen.huisnummer "huisnummer", adressen.bus "bus" FROM verkopers INNER JOIN adressen ON verkopers.adres_id = adressen.id INNER JOIN gebruikers ON verkopers.gebruiker_update_fk = gebruikers.id WHERE verkopers.id = ?`;

  pool.query(sql, [req.user.zoekGebruiker.verkoper_id], (err, result) => {
    if (err) console.log(err);
    else {
      res.send(result);
    }
  });
});

router.put("/", verifyToken, (req, res) => {
  const sql = `UPDATE verkopers SET naam=?,extra_naam=?,telefoon=?,email=?,btw_nr=?,bank=?,extra_bank=?,laatste_update=NOW(),gebruiker_update_fk=? WHERE id=?`;

  const sql2 = `UPDATE adressen SET straat=?,postcode=?,gemeente=?,land=?,huisnummer=?,bus=?,laatste_update=NOW(),gebruiker_update_fk=? WHERE id=?`;

  pool.query(
    sql,
    [
      req.body.naam,
      req.body.extra_naam,
      req.body.telefoon,
      req.body.email,
      req.body.btw_nr,
      req.body.bank,
      req.body.extra_bank,
      req.user.zoekGebruiker.id,
      req.body.id,
    ],
    (err, result) => {
      if (err) console.log(err);
      else {
        pool.query(
          sql2,
          [
            req.body.straat,
            req.body.postcode,
            req.body.gemeente,
            req.body.land,
            req.body.huisnummer,
            req.body.bus,
            req.user.zoekGebruiker.id,
            req.body.adres_id,
          ],
          (err, result2) => {
            if (err) console.log(err);
            else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

module.exports = router;
