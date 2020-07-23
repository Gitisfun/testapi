const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  pool.query(
    "SELECT btw.id 'id', btw.naam 'naam', btw.prijs 'prijs', btw.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM btw INNER JOIN gebruikers ON btw.gebruiker_update_fk = gebruikers.id WHERE btw.is_actief = 1 AND btw.verkoper_id = ? ORDER BY btw.prijs DESC",
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
  const sql = "SELECT btw.id 'id', btw.naam 'naam', btw.prijs 'prijs', btw.is_actief 'is_actief', btw.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM btw INNER JOIN gebruikers ON btw.gebruiker_update_fk = gebruikers.id WHERE btw.id = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      res.send(result);
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO btw(naam, prijs, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?, ?, ?, NOW(), ?, ?)";
  pool.query(
    sql,
    [
      req.body.naam,
      req.body.prijs,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        const btw = {
          id: results.insertId,
          naam: req.body.naam,
        };

        res.send(btw);
      }
    }
  );
});


router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM btw WHERE id = ?";

  const sql2 = "UPDATE btw SET naam = ?, prijs = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results)
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.naam,
            req.body.prijs,
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
          .json({ msg: `Geen btw met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;
