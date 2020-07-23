const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  let sort_by = req.query.sort_by;
  let sort_order = req.query.sort_order;

  console.log(sort_by);

  if (
    !(
      sort_by === "klantnummer" ||
      sort_by === "naam" ||
      sort_by === "laatste_update"
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

  const url = `SELECT klanten.id "id", klanten.klantnummer "klantnummer", klanten.naam "naam", klanten.is_blacklisted "is_blacklisted", klanten.laatste_update "laatste_update", gebruikers.naam "gebruikers_naam", gebruikers.id "gebruiker_update_fk" FROM klanten INNER JOIN gebruikers on klanten.gebruiker_update_fk = gebruikers.id WHERE klanten.is_actief = ? AND klanten.verkoper_id = ? AND concat(klanten.klantnummer,klanten.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;

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
        `SELECT COUNT(*) AS 'total' FROM klanten WHERE is_actief = ? AND verkoper_id = ? AND concat(klantnummer,naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order}`,
        [1, 2, search],
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
  const sql = `SELECT klanten.id "id", klanten.klantnummer "klantnummer", klanten.naam "naam", klanten.extra_naam "extra_naam", klanten.telefoon "telefoon", klanten.email "email", klanten.btw_id "btw_id", klanten.btw_nr "btw_nr", klanten.handelsregister_nr "handelsregister_nr", klanten.onderneming_type "onderneming_type", klanten.taal "taal", klanten.type "type", klanten.betalingstermijn_id "betalingstermijn_id", klanten.is_blacklisted "is_blacklisted", klanten.is_actief "is_actief", klanten.laatste_update "laatste_update", gebruikers.id "gebruiker_update_fk", klanten.verkoper_id "verkoper_id" FROM klanten INNER JOIN gebruikers on klanten.gebruiker_update_fk = gebruikers.id WHERE klanten.id = ?`;

  const sql2 =
    "SELECT id, straat, postcode, gemeente, land, huisnummer, bus, klant_id, is_actief, type FROM adressenklanten WHERE type='0' AND klant_id = ? AND is_actief = ?";

  const sql3 =
    "SELECT id, straat, postcode, gemeente, land, huisnummer, bus, klant_id, is_actief, type FROM adressenklanten WHERE type='1' AND klant_id = ? AND is_actief = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      pool.query(sql2, [req.params.id, 1], (err, resultsAdressen) => {
        if (err) console.log(err);
        else {
          result[0].adressen = resultsAdressen;
          pool.query(sql3, [req.params.id, 1], (err, resultsAdressenlev) => {
            if (err) console.log(err);
            else {
              result[0].adressenlev = resultsAdressenlev;
              res.send(result[0]);
            }
          });
        }
      });
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO klanten(klantnummer, naam, extra_naam, telefoon, email, btw_id, btw_nr, handelsregister_nr, onderneming_type, taal, type, betalingstermijn_id, is_blacklisted, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO adressenklanten(straat, postcode, gemeente, land, huisnummer, bus, klant_id, is_actief, laatste_update, gebruiker_update_fk, verkoper_id, type) VALUES (?,?,?,?,?,?,?,?,NOW(),?,?,?)";

  pool.query(
    sql,
    [
      req.body.klantnummer,
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
              0,
            ],
            (err, results2) => {
              if (err) console.log(err);
              else {
                console.log(results2);
              }
            }
          );
        }
        for (let i = 0; i < req.body.adressenlev.length; i++) {
          pool.query(
            sql2,
            [
              req.body.adressenlev[i].straat,
              req.body.adressenlev[i].postcode,
              req.body.adressenlev[i].gemeente,
              req.body.adressenlev[i].land,
              req.body.adressenlev[i].huisnummer,
              req.body.adressenlev[i].bus,
              results.insertId,
              req.body.is_actief,
              req.user.zoekGebruiker.id,
              req.user.zoekGebruiker.verkoper_id,
              1,
            ],
            (err, results2) => {
              if (err) console.log(err);
              else {
                console.log(results2);
                if (i === req.body.adressenlev.length - 1) {
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
  const sql1 = "SELECT COUNT(*) AS aantal FROM klanten WHERE id = ?";

  const sql2 =
    "UPDATE klanten SET klantnummer = ?, naam = ?, extra_naam = ?, telefoon = ?, email = ?, btw_id = ?, btw_nr = ?, handelsregister_nr = ?, onderneming_type = ?, taal = ?, type = ?, betalingstermijn_id = ?, is_blacklisted = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  const sql3 =
    "UPDATE adressenklanten SET straat = ?, postcode = ?, gemeente = ?, land = ?, huisnummer = ?, bus = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  const sql4 =
    "INSERT INTO adressenklanten(straat, postcode, gemeente, land, huisnummer, bus, klant_id, is_actief, type, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql5 =
    "INSERT INTO adressenklanten(straat, postcode, gemeente, land, huisnummer, bus, klant_id, is_actief, type, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  console.log(req.body);

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.klantnummer,
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
                      0,
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
              for (let i = 0; i < req.body.adressenlev.length; i++) {
                if (req.body.adressenlev[i].id >= 0) {
                  pool.query(
                    sql3,
                    [
                      req.body.adressenlev[i].straat,
                      req.body.adressenlev[i].postcode,
                      req.body.adressenlev[i].gemeente,
                      req.body.adressenlev[i].land,
                      req.body.adressenlev[i].huisnummer,
                      req.body.adressenlev[i].bus,
                      req.body.adressenlev[i].is_actief,
                      req.user.zoekGebruiker.id,
                      req.body.adressenlev[i].id,
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
                    sql5,
                    [
                      req.body.adressenlev[i].straat,
                      req.body.adressenlev[i].postcode,
                      req.body.adressenlev[i].gemeente,
                      req.body.adressenlev[i].land,
                      req.body.adressenlev[i].huisnummer,
                      req.body.adressenlev[i].bus,
                      req.params.id,
                      req.body.is_actief,
                      1,
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
          .json({ msg: `Geen klant met id ${req.params.id} gevonden` });
      }
    }
  });
});

router.put("/:id/joestar", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM klanten WHERE id = ?";

  const sql2 = "UPDATE klanten SET is_blacklisted = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

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
          .json({ msg: `Geen klant met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;