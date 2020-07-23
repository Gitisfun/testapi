const mysql = require("mysql");

/*
const config = {
  host: "107.6.166.26",
  user: "comagexi_commatest",
  password: "TFD8KqE*ILpA",
  database: "comagexi_ts_db_coma",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: 'utc+2'
};
*/
const config = {
  host: "107.6.166.26",
  user: "comagexi_antarctica",
  password: "I,CcSM^8fRg.",
  database: "comagexi_ts_db_coma",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: 'utc+2'
};


const pool = mysql.createPool(config);

module.exports = pool;