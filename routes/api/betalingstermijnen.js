const express = require("express");
const pool = require("../../database/config");
const router = express.Router();
const verifyToken = require("../../middleware/auth");

router.get("/",verifyToken, (req, res) => {
  pool.query(
    "SELECT betalingstermijnen.id 'id', betalingstermijnen.naam 'naam', betalingstermijnen.aantal 'aantal', betalingstermijnen.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM betalingstermijnen JOIN gebruikers ON betalingstermijnen.gebruiker_update_fk = gebruikers.id WHERE betalingstermijnen.is_actief = 1 AND betalingstermijnen.verkoper_id = ?",
    [req.user.zoekGebruiker.verkoper_id],
    (err, results) => {
      if (err) console.log(err);
      else {
        res.send(results);
      }
    }
  );
});

router.get("/:id",verifyToken, (req, res) => {
  const sql = "SELECT betalingstermijnen.id 'id', betalingstermijnen.naam 'naam', betalingstermijnen.aantal 'aantal', betalingstermijnen.is_actief 'is_actief', betalingstermijnen.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM betalingstermijnen INNER JOIN gebruikers ON betalingstermijnen.gebruiker_update_fk = gebruikers.id WHERE betalingstermijnen.id = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      res.send(result);
    }
  });
});

router.post("/",verifyToken, (req, res) => {
  const sql =
    "INSERT INTO betalingstermijnen(naam, aantal, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?, ?, ?, NOW(), ?, ?)";
  pool.query(
    sql,
    [
      req.body.naam,
      req.body.aantal,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        const bet = {
          id: results.insertId,
          naam: req.body.naam,
        };

        res.send(bet);
      }
    }
  );
});


router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM betalingstermijnen WHERE id = ?";

  const sql2 = "UPDATE betalingstermijnen SET naam = ?, aantal = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  console.log(req.body);

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results)
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.naam,
            req.body.aantal,
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
          .json({ msg: `Geen betalingstermijn met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;
