const connection = require("./database.js");

const isValidEmail = function (email) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

const executeQuery = function (sql, values) {
  return new Promise(function (resolve, reject) {
    connection.query(sql, values, function (err, result) {
      if (err) {
        reject({
          error_message: err.sqlMessage,
        });
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = { isValidEmail, executeQuery };
