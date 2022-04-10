const mysql = require("mysql");
const { db_config } = require("../utils/config.js");

const connection = mysql.createConnection(db_config);

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = connection;
