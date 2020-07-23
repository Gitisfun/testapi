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
      sort_by === "datum" ||
      sort_by === "factuurnr" ||
      sort_by === "ordernr" ||
      //sort_by === "leverancier_naam" ||
      //sort_by === "klant_naam" ||
      sort_by === "leveringsnr" ||
      sort_by === "is_geleverd" ||
      sort_by === "is_betaald" ||
      sort_by === "laatste_update"
    )
  ) {
    sort_by = "datum";
  }

  if (!(sort_order === "asc" || sort_order === "desc")) {
    sort_order = "asc";
  }

  const search = req.query.search;

  // Offset
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const url = `SELECT verkopen.id "id", verkopen.factuurnr "factuurnr", verkopen.ordernr "ordernr", verkopen.datum "datum", verkopen.betalingsdatum "betalingsdatum", verkopen.leveringsnr "referentienr", klanten.naam "klant_naam", verkopen.is_betaald "is_betaald", verkopen.laatste_update "laatste_update", gebruikers.naam "gebruikers_naam", gebruikers.id "gebruiker_update_fk"  
    FROM verkopen 
    INNER JOIN gebruikers ON verkopen.gebruiker_update_fk = gebruikers.id 
    INNER JOIN klanten ON verkopen.klant_id = klanten.id 
    WHERE verkopen.is_actief = ? 
    AND verkopen.verkoper_id = ? 
    AND concat(verkopen.ordernr,verkopen.leveringsnr,klanten.naam) 
    LIKE concat('%', ?, '%') 
    ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;
  //const url = `SELECT leveranciers.id "id", leveranciers.levnummer "levnummer", leveranciers.naam "naam", leveranciers.is_blacklisted "is_blacklisted", leveranciers.laatste_update "laatste_update", gebruikers.naam "gebruikers_naam", gebruikers.id "gebruiker_update_fk" FROM leveranciers INNER JOIN gebruikers on leveranciers.gebruiker_update_fk = gebruikers.id WHERE leveranciers.is_actief = ? AND leveranciers.verkoper_id = ? AND concat(leveranciers.levnummer,leveranciers.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;

  pool.query(
    url,
    [1, req.user.zoekGebruiker.verkoper_id, search, limit, startIndex],
    (err, resul) => {
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
          `SELECT COUNT(*) AS 'total' FROM verkopen INNER JOIN klanten ON verkopen.klant_id = klanten.id WHERE verkopen.is_actief = ? AND verkopen.verkoper_id = ? AND concat(verkopen.ordernr,verkopen.leveringsnr,klanten.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order}`,
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
    }
  );
});

router.get("/:id", verifyToken, (req, res) => {
  //const sql = "SELECT btw.id 'id', btw.naam 'naam', btw.prijs 'prijs', btw.is_actief 'is_actief', btw.laatste_update 'laatste_update', gebruikers.naam 'gebruiker_update_fk' FROM btw INNER JOIN gebruikers ON btw.gebruiker_update_fk = gebruikers.id WHERE btw.id = ?";
  const sql = `SELECT verkopen.id "id", verkopen.valuta "valuta", verkopen.subtotaal "subtotaal", verkopen.totaal "totaal", verkopen.factuurnr "factuurnummer", verkopen.ordernr "ordernr", verkopen.datum "datumtemp", verkopen.klant_id "klant_id", klanten.naam "klantnaam", 
  verkopen.leveringsnr "leveringsnr", verkopen.btw_id "btw_categorie_id", verkopen.betalingsdatum "betalingsdatumtemp", verkopen.begintekst "begintekst", 
  verkopen.eindtekst "eindtekst", verkopen.factuuradres_id "factuuradres_id", verkopen.is_betaald "is_betaald", verkopen.is_actief "is_actief", 
  verkopen.laatste_update "laatste_update", verkopen.gebruiker_update_fk "gebruiker_update_fk", verkopen.verkoper_id "verkoper_id", 
  adressenklanten.huisnummer "kl_nr",
  adressenklanten.bus "kl_bus",
  adressenklanten.straat "kl_straat",
  adressenklanten.postcode "kl_postcode",
  adressenklanten.gemeente "kl_gemeente",
  adressenklanten.land "kl_land",
  btw.naam "btw_naam",
  btw.prijs "btw_prijs"
  FROM verkopen
  INNER JOIN gebruikers ON verkopen.gebruiker_update_fk = gebruikers.id 
  INNER JOIN klanten ON verkopen.klant_id = klanten.id 
  INNER JOIN btw ON verkopen.btw_id = btw.id
  INNER JOIN adressenklanten ON verkopen.factuuradres_id = adressenklanten.id
  WHERE verkopen.id = ?`;

  const sql2 = `SELECT id, nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, verkoop_id FROM artikelsverkoop WHERE verkoop_id = ?`;

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      pool.query(sql2, [req.params.id, 1], (err, resultsVerkoop) => {
        if (err) console.log(err);
        else if (result.length === 0) {
          res.send(result);
        } else {
          result[0].artikels = resultsVerkoop;
          res.send(result[0]);
        }
      });
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO verkopen(valuta, subtotaal, totaal, factuurnr, ordernr, datum, klant_id, leveringsnr, btw_id, betalingsdatum, begintekst, eindtekst, factuuradres_id, is_betaald, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO artikelsverkoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, verkoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  const sql3 = "SELECT waarde FROM counterverkoop WHERE verkoper_id = ?";

  const sql4 = "UPDATE counterverkoop SET waarde = waarde + 1 WHERE verkoper_id = ?";

  const sql5 =
    "UPDATE verkopen SET ordernr=CONCAT(YEAR(NOW()),'-',?) WHERE id=?";

  pool.query(
    sql,
    [
      req.body.valuta,
      req.body.subtotaal,
      req.body.totaal,
      req.body.factuurnummer,
      req.body.ordernr,
      req.body.datum,
      req.body.klant_id,
      req.body.leveringsnr,
      req.body.btw_categorie_id,
      req.body.betalingsdatum,
      req.body.begintekst,
      req.body.eindtekst,
      req.body.factuuradres_id,
      req.body.is_betaald,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        console.log(results);
        pool.query(sql3, [req.user.zoekGebruiker.verkoper_id], (err, results3) => {
          if (err) console.log(err);
          else {

            pool.query(sql4, [req.user.zoekGebruiker.verkoper_id], (err, results4) => {
              if(err) console.log(err)
              else{
                console.log(results4)
                pool.query(sql5, [results3[0].waarde, results.insertId], (err, results5) =>{
                  if(err) console.log(err)
                  else{
                    for (let i = 0; i < req.body.artikels.length; i++) {
                      pool.query(
                        sql2,
                        [
                          req.body.artikels[i].nr,
                          req.body.artikels[i].naam,
                          req.body.artikels[i].memo,
                          req.body.artikels[i].prijs,
                          req.body.artikels[i].hoeveelheid,
                          req.body.artikels[i].korting1,
                          req.body.artikels[i].korting2,
                          req.body.artikels[i].totaal,
                          results.insertId,
                        ],
                        (err, results2) => {
                          if (err) console.log(err);
                          else {
                            console.log(results2);
                            if (i === req.body.artikels.length - 1) {
                              res.send({
                                msq: "Succes",
                                insertedId: results3[0].waarde,
                              });
                            }
                          }
                        }
                      );
                    }
                  }
                })
              }
            })
          }
        });
      }
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal from verkopen WHERE id = ?";
  const sql2 =
    "UPDATE verkopen SET valuta=?, subtotaal=?, totaal=?, factuurnr=?,ordernr=?,datum=?,klant_id=?,leveringsnr=?,btw_id=?,betalingsdatum=?,begintekst=?,eindtekst=?,factuuradres_id=?,is_betaald=?,is_actief=?,laatste_update=NOW(),gebruiker_update_fk=? WHERE id = ?";
  const sql3 = "DELETE FROM artikelsverkoop WHERE verkoop_id = ?";
  //"UPDATE artikelsaankoop SET nr = ?,naam = ?,klant_nr = ?,memo = ?,prijs = ?,hoeveelheid = ?,korting1 = ?,korting2 = ?,totaal = ?,btw = ?,totaal_met_btw = ? WHERE id = ?";

  const sql4 =
    "INSERT INTO artikelsverkoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, verkoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.valuta,
            req.body.subtotaal,
            req.body.totaal,
            req.body.factuurnummer,
            req.body.ordernr,
            req.body.datum,
            req.body.klant_id,
            req.body.leveringsnr,
            req.body.btw_categorie_id,
            req.body.betalingsdatum,
            req.body.begintekst,
            req.body.eindtekst,
            req.body.factuuradres_id,
            req.body.is_betaald,
            req.body.is_actief,
            req.user.zoekGebruiker.id,
            req.params.id,
          ],
          (err, results2) => {
            if (err) console.log(err);
            else if (req.body.artikels.length <= 0) {
              res.send(results2);
            } else {
              pool.query(sql3, [req.params.id], (err, results3) => {
                if (err) console.log(err);
                else {
                  console.log(results3);
                  for (let i = 0; i < req.body.artikels.length; i++) {
                    pool.query(
                      sql4,
                      [
                        req.body.artikels[i].nr,
                        req.body.artikels[i].naam,
                        req.body.artikels[i].memo,
                        req.body.artikels[i].prijs,
                        req.body.artikels[i].hoeveelheid,
                        req.body.artikels[i].korting1,
                        req.body.artikels[i].korting2,
                        req.body.artikels[i].totaal,
                        req.params.id,
                      ],
                      (err, results2) => {
                        if (err) console.log(err);
                        else {
                          console.log(results2);
                          if (i === req.body.artikels.length - 1) {
                            res.status(200).json({ msg: "Succesvol" });
                          }
                        }
                      }
                    );
                  }
                }
              });
            }
          }
        );
      }
    }
  });
});

router.put("/:id/ora", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM verkopen WHERE id = ?";

  const sql2 =
    "UPDATE verkopen SET is_betaald = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            Number(req.body.is_betaald),
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
          .json({ msg: `Geen factuur met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;
/*

router.post("/", verifyToken, (req, res) => {
  console.log(req.body);
  const sql =
    "INSERT INTO verkopen(valuta, subtotaal, totaal, factuurnr, ordernr, datum, klant_id, leveringsnr, btw_id, betalingsdatum, begintekst, eindtekst, factuuradres_id, is_betaald, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO artikelsverkoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, verkoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  const sql3 = "UPDATE verkopen SET ordernr=? WHERE id=?";

  pool.query(
    sql,
    [
      req.body.valuta,
      req.body.subtotaal,
      req.body.totaal,
      req.body.factuurnummer,
      req.body.ordernr,
      req.body.datum,
      req.body.klant_id,
      req.body.leveringsnr,
      req.body.btw_categorie_id,
      req.body.betalingsdatum,
      req.body.begintekst,
      req.body.eindtekst,
      req.body.factuuradres_id,
      req.body.is_betaald,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else if (req.body.artikels.length <= 0) {
        res.send(results);
      } else {
        console.log(results);
        pool.query(
          sql3,
          [results.insertId, results.insertId],
          (err, results3) => {
            if (err) console.log(err);
            else {
              for (let i = 0; i < req.body.artikels.length; i++) {
                pool.query(
                  sql2,
                  [
                    req.body.artikels[i].nr,
                    req.body.artikels[i].naam,
                    req.body.artikels[i].memo,
                    req.body.artikels[i].prijs,
                    req.body.artikels[i].hoeveelheid,
                    req.body.artikels[i].korting1,
                    req.body.artikels[i].korting2,
                    req.body.artikels[i].totaal,
                    results.insertId,
                  ],
                  (err, results2) => {
                    if (err) console.log(err);
                    else {
                      console.log(results2);
                      if (i === req.body.artikels.length - 1) {
                        res.send({msq: "Succes", insertedId: results.insertId});
                      }
                    }
                  }
                );
              }
            }
          }
        );
      }
    }
  );
});
*/
