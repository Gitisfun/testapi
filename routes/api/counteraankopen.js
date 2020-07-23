const express = require("express");
const router = express.Router();
const pool = require("../../database/config");
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
    const sql = "SELECT id, waarde FROM counteraankoop WHERE verkoper_id = ?"

    pool.query(sql, [req.user.zoekGebruiker.verkoper_id], (err, result) => {
        if(err) console.log(err)
        else{
            res.send(result);
        }
    })
})

router.put("/:id", verifyToken, (req, res) => {
    const sql = "UPDATE counteraankoop SET waarde=? WHERE id = ?"

    pool.query(sql, [req.body.waarde, req.params.id], (err, result) => {
        if(err) console.log(err)    
        else{
            res.send(result);
        }
    })
});

module.exports = router;