const express = require("express");
const pool = require("../../database/config");
const router = express.Router();
const verifyToken = require("../../middleware/auth");


router.get("/",verifyToken, (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  let sort_by = req.query.sort_by;
  let sort_order = req.query.sort_order;

  console.log(sort_by);

  if (
    !(
      sort_by === "artikelcode" ||
      sort_by === "prijs" ||
      sort_by === "naam" ||
      sort_by === "omschrijving" ||
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

  const url = `SELECT artikels.id "id", artikels.naam "naam", artikels.in_stock "in_stock", artikels.artikelcode "artikelcode", artikels.prijs "prijs", artikels.omschrijving "omschrijving", artikels.laatste_update "laatste_update", artikels.gebruiker_update_fk "gebruiker_update_fk", gebruikers.naam "gebruikers_naam" FROM artikels INNER JOIN gebruikers on artikels.gebruiker_update_fk = gebruikers.id WHERE artikels.is_actief = ? AND artikels.verkoper_id = ? AND concat(artikels.artikelcode,artikels.naam,artikels.omschrijving) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;

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
        `SELECT COUNT(*) AS 'total' FROM artikels WHERE is_actief = ? AND verkoper_id = ? AND concat(artikelcode,naam,omschrijving) LIKE concat('%', ?, '%') ORDER BY ${sort_by} ${sort_order}`,
        [1,2,search],
        //"SELECT COUNT(*) AS 'total' FROM artikels",
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
  const sql = "SELECT artikels.artikelcode, artikels.naam, artikels.prijs, artikels.omschrijving, artikels.leverancier_id, leveranciers.naam 'lev_naam', artikels.btw_id, artikels.verkoopeenheid, artikels.ean, artikels.memo, artikels.valuta, artikels.in_stock, artikels.netto_aankoop, artikels.kosten_aankoop, artikels.marge, artikels.laatste_update, artikels.gebruiker_update_fk, gebruikers.naam 'gebr_naam' FROM artikels INNER JOIN leveranciers ON artikels.leverancier_id = leveranciers.id INNER JOIN gebruikers ON artikels.gebruiker_update_fk = gebruikers.id WHERE artikels.id = ?";

  pool.query(sql, [req.params.id], (err, result) => {
    if (err) console.log(err);
    else {
      res.send(result);
    }
  });
});

router.post("/", verifyToken, (req, res) => {
  const sql =
    "INSERT INTO `artikels`(`artikelcode`, `naam`, `prijs`, `omschrijving`, `leverancier_id`, `btw_id`, `verkoopeenheid`, `ean`, `memo`, `valuta`, `in_stock`, `netto_aankoop`, `kosten_aankoop`, `marge`, `is_actief`, `laatste_update`, `gebruiker_update_fk`, `verkoper_id`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)";

  pool.query(
    sql,
    [
      req.body.artikelcode,
      req.body.naam,
      req.body.prijs,
      req.body.omschrijving,
      req.body.leverancier_id,
      req.body.btw_id,
      req.body.verkoopeenheid,
      req.body.ean,
      req.body.memo,
      req.body.valuta,
      req.body.in_stock,
      req.body.netto_aankoop,
      req.body.kosten_aankoop,
      req.body.marge,
      req.body.is_actief,
      req.user.zoekGebruiker.id,
      req.user.zoekGebruiker.verkoper_id,
    ],
    (err, results) => {
      if (err) console.log(err);
      else {
        const artikel = {
          id: results.insertId,
          naam: req.body.naam,
        };

        res.send(artikel);
      }
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM artikels WHERE id = ?";

  const sql2 = "UPDATE artikels SET artikelcode = ?, naam = ?, prijs = ?, omschrijving = ?, leverancier_id = ?, btw_id = ?, verkoopeenheid = ?, ean = ?, memo = ?, valuta = ?,in_stock = ?, netto_aankoop = ?, kosten_aankoop = ?, marge = ?, is_actief = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";


  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            req.body.artikelcode,
            req.body.naam,
            req.body.prijs,
            req.body.omschrijving,
            req.body.leverancier_id,
            req.body.btw_id,
            req.body.verkoopeenheid,
            req.body.ean,
            req.body.memo,
            req.body.valuta,
            req.body.in_stock,
            req.body.netto_aankoop,
            req.body.kosten_aankoop,
            req.body.marge,
            req.body.is_actief,
            req.user.zoekGebruiker.id,
            req.params.id,
          ],
          (err, results) => {
            if (err) console.log(err);
            else {
              res.send(results);
            }
          }
        );
      } else {
        res
          .status(400)
          .json({ msg: `Geen artikel met id ${req.params.id} gevonden` });
      }
    }
  });
});

router.put("/:id/joestar", verifyToken, (req, res) => {
  const sql1 = "SELECT COUNT(*) AS aantal FROM artikels WHERE id = ?";

  const sql2 = "UPDATE artikels SET in_stock = ?, laatste_update = NOW(), gebruiker_update_fk = ? WHERE id = ?";

  pool.query(sql1, [req.params.id], (err, results) => {
    if (err) console.log(err);
    else {
      console.log(results);
      if (results[0].aantal > 0) {
        pool.query(
          sql2,
          [
            Number(req.body.in_stock),
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
          .json({ msg: `Geen artikel met id ${req.params.id} gevonden` });
      }
    }
  });
});


module.exports = router;