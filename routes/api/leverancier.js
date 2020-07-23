const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  let sort_by = req.query.sort_by;
  let sort_order = req.query.sort_order;

  if (
    !(
      sort_by === "levnummer" ||
      sort_by === "naam" ||
      sort_by === "laatste_update" ||
      sort_by === "is_blacklisted"
    )
  ) {
    sort_by = "naam";
  }

  if (!(sort_order === "asc" || sort_order === "desc")) {
    sort_order = "asc";
  }

  const search = req.query.search;

  // Offset
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const url = `SELECT leveranciers.id "id", leveranciers.levnummer "levnummer", leveranciers.naam "naam", leveranciers.is_blacklisted "is_blacklisted", leveranciers.laatste_update "laatste_update", gebruikers.naam "gebruikers_naam", gebruikers.id "gebruiker_update_fk" FROM leveranciers INNER JOIN gebruikers on leveranciers.gebruiker_update_fk = gebruikers.id WHERE leveranciers.is_actief = ? AND leveranciers.verkoper_id = ? AND concat(leveranciers.levnummer,leveranciers.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;

  pool.query(url, [1, req.user.zoekGebruiker.verkoper_id, search, limit, startIndex], (err, resul) => {
    if (err) console.log(err);
    else {
      const results = {};
      if (endIndex < resul.length) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }

      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }
      results.data = resul;

      pool.query(
        `SELECT COUNT(*) AS 'total' FROM leveranciers WHERE is_actief = ? AND verkoper_id = ? AND concat(levnummer,naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order}`,
        [1, req.user.zoekGebruiker.verkoper_id, search],
        (err, totalres) => {
          if (err) console.log(err);
          else {
            results.total = totalres[0].total;
            res.send(results);
          }
        }
      );
    }
  });
});

router.get("/:id", verifyToken, (req, res) => {
  //const sql = "SELECT btw.id 'id', btw.naam 'naam', btw.prijs 'prijs', btw.is_actief 'is_actief', btw.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM btw INNER JOIN gebruikers ON btw.gebruiker_update_fk = gebruikers.id WHERE btw.id = ?";
  const sql = `SELECT leveranciers.id "id", leveranciers.levnummer "levnummer", leveranciers.naam "naam", leveranciers.extra_naam "extra_naam", leveranciers.telefoon "telefoon", leveranciers.email "email", leveranciers.btw_id "btw_id", leveranciers.btw_nr "btw_nr", leveranciers.handelsregister_nr "handelsregister_nr", leveranciers.onderneming_type "onderneming_type", leveranciers.taal "taal", leveranciers.type "type", leveranciers.betalingstermijn_id "betalingstermijn_id", leveranciers.is_blacklisted "is_blacklisted", leveranciers.is_actief "is_actief", leveranciers.laatste_update "laatste_update", gebruikers.id "gebruiker_update_fk", leveranciers.verkoper_id "verkoper_id" FROM leveranciers INNER JOIN gebruikers on leveranciers.gebruiker_update_fk = gebruikers.id WHERE leveranciers.id = ?`;

  const sql2 =
    "SELECT id, straat, postcode, gemeente, land, huisnummer, bus, leverancier_id, is_actief FROM adressenlev WHERE leverancier_id = ? AND is_actief = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      pool.query(sql2, [req.params.id, 1], (err, resultsAdressen) => {
        if (err) console.log(err);
        else {
          result[0].adressen = resultsAdressen;
          res.send(result[0]);
        }
      });
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO leveranciers(levnummer, naam, extra_naam, telefoon, email, btw_id, btw_nr, handelsregister_nr, onderneming_type, taal, type, betalingstermijn_id, is_blacklisted, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO adressenlev(straat, postcode, gemeente, land, huisnummer, bus, leverancier_id, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,NOW(),?,?)";

  pool.query(
    sql,
    [
      req.body.levnummer,
      req.body.naam,
      req.body.extra_naam,
      req.body.telefoon,
      req.body.email,
      req.body.btw_id,
      req.body.btw_nr,
      req.body.handelsregister_nr,
      req.body.onderneming_type,
      req.body.taal,
      req.body.type,
      req.body.betalingstermijn_id,
      req.body.is_blacklisted,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else if (req.body.adressen.length <= 0) {
        res.send(results);
      } else {
        console.log(results);
        for (let i = 0; i < req.body.adressen.length; i++) {
          pool.query(
            sql2,
            [
              req.body.adressen[i].straat,
              req.body.adressen[i].postcode,
              req.body.adressen[i].gemeente,
              req.body.adressen[i].land,
              req.body.adressen[i].huisnummer,
              req.body.adressen[i].bus,
              results.insertId,
              req.body.is_actief,
              req.user.zoekGebruiker.id,
              req.user.zoekGebruiker.verkoper_id,
            ],
            (err, results2) => {
              if (err) console.log(err);
              else {
                console.log(results2);
                if (i === req.body.adressen.length - 1) {
                  res.send(results2);
                }
              }
            }
          );
        }
      }
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM leveranciers WHERE id = ?";

  const sql2 =
    "UPDATE leveranciers SET levnummer = ?, naam = ?, extra_naam = ?, telefoon = ?, email = ?, btw_id = ?, btw_nr = ?, handelsregister_nr = ?, onderneming_type = ?, taal = ?, type = ?, betalingstermijn_id = ?, is_blacklisted = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  const sql3 =
    "UPDATE adressenlev SET straat = ?, postcode = ?, gemeente = ?, land = ?, huisnummer = ?, bus = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  const sql4 =
    "INSERT INTO adressenlev(straat, postcode, gemeente, land, huisnummer, bus, leverancier_id, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,NOW(),?,?)";

  console.log(req.body);

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.levnummer,
            req.body.naam,
            req.body.extra_naam,
            req.body.telefoon,
            req.body.email,
            req.body.btw_id,
            req.body.btw_nr,
            req.body.handelsregister_nr,
            req.body.onderneming_type,
            req.body.taal,
            req.body.type,
            req.body.betalingstermijn_id,
            req.body.is_blacklisted,
            req.body.is_actief,
            req.user.zoekGebruiker.id,
            req.params.id,
          ],
          (err, results2) => {
            if (err) console.log(err);
            else if (req.body.adressen.length <= 0) {
              res.send(results2);
            } else {
              for (let i = 0; i < req.body.adressen.length; i++) {
                if (req.body.adressen[i].id >= 0) {
                  pool.query(
                    sql3,
                    [
                      req.body.adressen[i].straat,
                      req.body.adressen[i].postcode,
                      req.body.adressen[i].gemeente,
                      req.body.adressen[i].land,
                      req.body.adressen[i].huisnummer,
                      req.body.adressen[i].bus,
                      req.body.adressen[i].is_actief,
                      req.user.zoekGebruiker.id,
                      req.body.adressen[i].id,
                    ],
                    (err, results3) => {
                      if (err) console.log(err);
                      else {
                        console.log(results3);
                      }
                    }
                  );
                } else {
                  pool.query(
                    sql4,
                    [
                      req.body.adressen[i].straat,
                      req.body.adressen[i].postcode,
                      req.body.adressen[i].gemeente,
                      req.body.adressen[i].land,
                      req.body.adressen[i].huisnummer,
                      req.body.adressen[i].bus,
                      req.params.id,
                      req.body.is_actief,
                      req.user.zoekGebruiker.id,
                      req.user.zoekGebruiker.verkoper_id,
                    ],
                    (err, results4) => {
                      if (err) console.log(err);
                      else {
                        console.log(results4);
                      }
                    }
                  );
                }
              }
              res.status(200).json({ msg: `Succesvol` });
            }
          }
        );
      } else {
        res
          .status(400)
          .json({ msg: `Geen leverancier met id ${req.params.id} gevonden` });
      }
    }
  });
});

router.put("/:id/joestar", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM leveranciers WHERE id = ?";

  const sql2 =
    "UPDATE leveranciers SET is_blacklisted = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            Number(req.body.is_blacklisted),
            req.user.zoekGebruiker.id,
            req.params.id,
          ],
          (err, results2) => {
            if (err) console.log(err);
            else {
              console.log(results2);
              res.send(results2);
            }
          }
        );
      } else {
        res
          .status(400)
          .json({ msg: `Geen leverancier met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;
