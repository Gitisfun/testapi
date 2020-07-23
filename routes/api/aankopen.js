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
      sort_by === "bestelnummer" ||
      sort_by === "leveringsnummer" ||
      //sort_by === "leverancier_naam" ||
      //sort_by === "klant_naam" ||
      sort_by === "leverdatum" ||
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

  const url = `SELECT aankopen.id "id", aankopen.factuurnummer "factuurnr", aankopen.datum "datum", klanten.naam "klant_naam", aankopen.leveringsnummer "leveringsnummer", aankopen.bestelnummer "bestelnummer", aankopen.leverdatum "leverdatum", leveranciers.naam "leverancier_naam", aankopen.is_geleverd "is_geleverd", aankopen.is_betaald "is_betaald", aankopen.laatste_update "laatste_update", gebruikers.naam "gebruikers_naam", gebruikers.id "gebruiker_update_fk" FROM aankopen INNER JOIN gebruikers ON aankopen.gebruiker_update_fk = gebruikers.id INNER JOIN klanten ON aankopen.klant_id = klanten.id INNER JOIN leveranciers ON aankopen.leverancier_id = leveranciers.id WHERE aankopen.is_actief = ? AND aankopen.verkoper_id = ? AND concat(aankopen.leveringsnummer,aankopen.bestelnummer,klanten.naam,leveranciers.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;
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
          `SELECT COUNT(*) AS 'total' FROM aankopen INNER JOIN klanten ON aankopen.klant_id = klanten.id INNER JOIN leveranciers ON aankopen.leverancier_id = leveranciers.id WHERE aankopen.is_actief = ? AND aankopen.verkoper_id = ? AND concat(aankopen.leveringsnummer,aankopen.bestelnummer,klanten.naam,leveranciers.naam) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order}`,
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

const sql = `SELECT aankopen.id "id", aankopen.subtotaal "subtotaal", aankopen.totaal "totaal", aankopen.valuta "valuta", aankopen.factuurnummer "factuurnummer", aankopen.datum "datum", aankopen.klant_id "klant_id", klanten.naam "klantnaam", aankopen.leveringsnummer "leveringsnr", aankopen.bestelnummer "bestelnr", aankopen.btw_id "btw_categorie_id", aankopen.vervaldag "vervaldagdatum", 
aankopen.leverdatum "leverdatum", aankopen.leverancier_id "leverancier_id", leveranciers.naam "leverancier_naam", aankopen.incoterm "incoterm", aankopen.begintekst "begintekst", aankopen.eindtekst "eindtekst", aankopen.factuuradres_id "factuuradres_id", aankopen.leveradres_id "leveradres_id", 
aankopen.is_geleverd "is_geleverd", aankopen.is_betaald "is_betaald", aankopen.is_actief "is_actief", aankopen.laatste_update "laatste_update", aankopen.gebruiker_update_fk "gebruiker_update_fk", gebruikers.naam "gebruikers_naam", aankopen.verkoper_id "verkoper_id",
adressenklanten.huisnummer "kl_nr",
adressenklanten.bus "kl_bus",
adressenklanten.straat "kl_straat",
adressenklanten.postcode "kl_postcode",
adressenklanten.gemeente "kl_gemeente",
adressenklanten.land "kl_land",
btw.naam "btw_naam",
btw.prijs "btw_prijs"
FROM aankopen
INNER JOIN gebruikers ON aankopen.gebruiker_update_fk = gebruikers.id 
INNER JOIN leveranciers ON aankopen.leverancier_id = leveranciers.id 
INNER JOIN klanten ON aankopen.klant_id = klanten.id 
INNER JOIN btw ON aankopen.btw_id = btw.id
INNER JOIN adressenklanten ON aankopen.factuuradres_id = adressenklanten.id
WHERE aankopen.id = ?`;

 const sql2 =
   "SELECT id, nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, aankoop_id FROM artikelsaankoop WHERE aankoop_id = ?";

 const sql3 =
   "SELECT straat, postcode, gemeente, land, huisnummer, bus FROM adressenklanten WHERE id = ?";

 pool.query(sql, [req.params.id], (err, result) => {
   if (err) console.log(err);
   else {
     pool.query(sql3, [result[0].leveradres_id], (err, resultsAdres) => {
       if (err) console.log(err);
       else {
         result[0].lev_nr = resultsAdres[0].huisnummer;
         result[0].lev_bus = resultsAdres[0].bus;
         result[0].lev_straat = resultsAdres[0].straat;
         result[0].lev_postcode = resultsAdres[0].postcode;
         result[0].lev_gemeente = resultsAdres[0].gemeente;
         result[0].lev_land = resultsAdres[0].land;
         pool.query(sql2, [req.params.id, 1], (err, resultsAankoop) => {
           if (err) console.log(err);
           else if (result.length === 0) {
             res.send(result);
           } else {
             result[0].artikels = resultsAankoop;
             console.log(result);
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
    "INSERT INTO aankopen(subtotaal, totaal, valuta, factuurnummer, datum, klant_id, leveringsnummer, bestelnummer, btw_id, vervaldag, leverdatum, leverancier_id, incoterm, begintekst, eindtekst, factuuradres_id, leveradres_id, is_geleverd, is_betaald, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO artikelsaankoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, aankoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  const sql3 = "SELECT waarde FROM counteraankoop WHERE verkoper_id = ?";

  const sql4 =
    "UPDATE counteraankoop SET waarde = waarde + 1 WHERE verkoper_id = ?";

  const sql5 =
    "UPDATE aankopen SET bestelnummer=CONCAT(YEAR(NOW()),'-',?) WHERE id=?";

  pool.query(
    sql,
    [
      req.body.subtotaal,
      req.body.totaal,
      req.body.valuta,
      req.body.factuurnummer,
      req.body.datum,
      req.body.klant_id,
      req.body.leveringsnr,
      req.body.bestelnr,
      req.body.btw_categorie_id,
      req.body.vervaldag,
      req.body.leverdatum,
      req.body.leverancier_id,
      req.body.incoterm,
      req.body.begintekst,
      req.body.eindtekst,
      req.body.factuuradres_id,
      req.body.leveradres_id,
      req.body.is_geleverd,
      req.body.is_betaald,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        pool.query(
          sql3,
          [req.user.zoekGebruiker.verkoper_id],
          (err, results3) => {
            if (err) console.log(err);
            else {
              pool.query(
                sql4,
                [req.user.zoekGebruiker.verkoper_id],
                (err, results4) => {
                  if (err) console.log(err);
                  else {
                    pool.query(
                      sql5,
                      [results3[0].waarde, results.insertId],
                      (err, results5) => {
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
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  console.log(req.body);
  const sql1 = "SELECT COUNT(*) AS aantal from aankopen WHERE id = ?";
  const sql2 =
    "UPDATE aankopen SET subtotaal=?, totaal=?, valuta=?, factuurnummer=?,datum=?,klant_id=?,leveringsnummer=?,bestelnummer=?,btw_id=?,vervaldag=?,leverdatum=?,leverancier_id=?,incoterm=?,begintekst=?,eindtekst=?,factuuradres_id=?,leveradres_id=?,is_geleverd=?,is_betaald=?,is_actief=?,laatste_update=NOW(),gebruiker_update_fk = ? WHERE id = ?";

  const sql3 = "DELETE FROM artikelsaankoop WHERE aankoop_id = ?";
  //"UPDATE artikelsaankoop SET nr = ?,naam = ?,klant_nr = ?,memo = ?,prijs = ?,hoeveelheid = ?,korting1 = ?,korting2 = ?,totaal = ?,btw = ?,totaal_met_btw = ? WHERE id = ?";

  const sql4 =
    "INSERT INTO artikelsaankoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, aankoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.subtotaal,
            req.body.totaal,
            req.body.valuta,
            req.body.factuurnummer,
            req.body.datum,
            req.body.klant_id,
            req.body.leveringsnr,
            req.body.bestelnr,
            req.body.btw_categorie_id,
            req.body.vervaldag,
            req.body.leverdatum,
            req.body.leverancier_id,
            req.body.incoterm,
            req.body.begintekst,
            req.body.eindtekst,
            req.body.factuuradres_id,
            req.body.leveradres_id,
            req.body.is_geleverd,
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

router.put("/:id/muda", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM aankopen WHERE id = ?";

  const sql2 =
    "UPDATE aankopen SET is_geleverd = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            Number(req.body.is_geleverd),
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
          .json({ msg: `Geen bestelling met id ${req.params.id} gevonden` });
      }
    }
  });
});

router.put("/:id/ora", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM aankopen WHERE id = ?";

  const sql2 =
    "UPDATE aankopen SET is_betaald = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

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
          .json({ msg: `Geen bestelling met id ${req.params.id} gevonden` });
      }
    }
  });
});

module.exports = router;

/*
router.post("/", verifyToken, (req, res) => {
  console.log(req.body);
  const sql =
    "INSERT INTO aankopen(subtotaal, totaal, valuta, factuurnummer, datum, klant_id, leveringsnummer, bestelnummer, btw_id, vervaldag, leverdatum, leverancier_id, incoterm, begintekst, eindtekst, factuuradres_id, leveradres_id, is_geleverd, is_betaald, is_actief, laatste_update, gebruiker_update_fk, verkoper_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  const sql2 =
    "INSERT INTO artikelsaankoop(nr, naam, memo, prijs, hoeveelheid, korting1, korting2, totaal, aankoop_id) VALUES (?,?,?,?,?,?,?,?,?)";

  const sql3 = "UPDATE aankopen SET bestelnummer=? WHERE id=?";

  pool.query(
    sql,
    [
      req.body.subtotaal,
      req.body.totaal,
      req.body.valuta,
      req.body.factuurnummer,
      req.body.datum,
      req.body.klant_id,
      req.body.leveringsnr,
      req.body.bestelnr,
      req.body.btw_categorie_id,
      req.body.vervaldag,
      req.body.leverdatum,
      req.body.leverancier_id,
      req.body.incoterm,
      req.body.begintekst,
      req.body.eindtekst,
      req.body.factuuradres_id,
      req.body.leveradres_id,
      req.body.is_geleverd,
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
              console.log(results3)
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
