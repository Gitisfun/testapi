const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  pool.query(
    "SELECT teksten.id 'id', teksten.tekst 'tekst', teksten.type 'type', teksten.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM teksten INNER JOIN gebruikers ON teksten.gebruiker_update_fk = gebruikers.id WHERE teksten.is_actief = 1 AND teksten.verkoper_id = ?",
    [req.user.zoekGebruiker.verkoper_id],
    (err, results) => {
      if (err) console.log(err);
      else {
        res.send(results);
      }
    }
  );
});

router.get("/:id", verifyToken, (req, res) => {
  const sql = "SELECT teksten.id 'id', teksten.tekst 'tekst', teksten.type 'type', teksten.is_actief 'is_actief', teksten.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM teksten INNER JOIN gebruikers ON teksten.gebruiker_update_fk = gebruikers.id WHERE teksten.id = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      res.send(result);
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO teksten(tekst, type, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?, ?, ?, NOW(), ?, ?)";
  pool.query(
    sql,
    [
      req.body.tekst,
      req.body.type,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        const tekst = {
          id: results.insertId,
          tekst: req.body.tekst,
        };

        res.send(tekst);
      }
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM teksten WHERE id = ?";

  const sql2 = "UPDATE teksten SET tekst = ?, type = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  console.log(req.body);

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results)
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.tekst,
            req.body.type,
            req.body.is_actief,
            req.user.zoekGebruiker.id,
            req.params.id
          ],
          (err, results2) => {
            if (err) console.log(err);
            else {
              console.log(results2)
              res.send(results2);
            }
          }
        );
      } else {
        res
          .status(400)
          .json({ msg: `Geen tekst met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;
