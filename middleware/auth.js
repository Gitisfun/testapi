const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (req.headers["authorization"]) {
    const bearerHeader = req.headers["authorization"];
    const token = bearerHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, "my_secret_key", (err, user) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.user = user;
        //console.log(user)
        next();
      }
    });
  } else {
    return res.sendStatus(403);
  }
};
