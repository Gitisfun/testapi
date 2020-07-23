const express = require("express");
const pool = require("../../database/config");
const router = express.Router();
const verifyToken = require("../../middleware/auth");

// Type 0 is facturatie
// Type 1 is levering
router.post("/", verifyToken, (req, res) => {
    const sql = `SELECT * FROM adressenlev WHERE leverancier_id = ? AND is_actief = ?`

    pool.query(sql, [req.body.ref_id, 1], (err, result) =>{
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