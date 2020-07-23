const express = require("express");
const pool = require("../../database/config");
const { verify } = require("jsonwebtoken");
const router = express.Router();
const verifyToken = require("../../middleware/auth");

// Type 0 is facturatie
// Type 1 is levering
router.post("/", verifyToken, (req, res) => {
    const sql = `SELECT * FROM adressenklanten WHERE klant_id = ? AND type = ? AND is_actief = ?`

    pool.query(sql, [req.body.ref_id, req.body.type, 1], (err, result) =>{
        if(err) console.log(err)
        else if(result.length === 0){
            res.send(result) 
        }
        else{
            res.send(result);
        }
    });
});

module.exports = router;