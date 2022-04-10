const { isValidEmail, executeQuery } = require("../utils/common_functions.js");
const md5 = require("md5");
const { jwt_secret } = require("../utils/config.js");
const authenticate = require("../middlewares/authenticate.js");
const jwt = require("jsonwebtoken");

const multerImageUpload = require("../middlewares/multer_image_upload.js");

module.exports = function (app) {
  app.post("/user/login", async function (req, res) {
    const requestData = req.body;
    let error_message = "";
    let status_code = 400;
    if (!isValidEmail(requestData.email)) {
      error_message = "Please provide a valid email";
      return res.status(status_code).send({
        error_message: error_message,
      });
    } else if (!requestData.password) {
      error_message = "Password cannot be empty";
      return res.status(status_code).send({
        error_message: error_message,
      });
    }
    try {
      let userObj = null;
      if (!error_message) {
        const getUserByEmailSql = "SELECT * FROM users WHERE user_email = ?";
        const getUserByEmailValues = [requestData.email];
        const existingUsersWithSameEmail = await executeQuery(
          getUserByEmailSql,
          getUserByEmailValues
        );
        if (!existingUsersWithSameEmail.length) {
          error_message = `User email not found`;
          status_code = 404;
        } else {
          userObj = existingUsersWithSameEmail[0];
          if (userObj.user_password != md5(requestData.password)) {
            error_message = `Invalid email or password`;
            status_code = 401;
          }
        }
      }

      if (error_message) {
        return res.status(status_code).send({
          error_message: error_message,
        });
      }
      const jwt_token = jwt.sign(
        {
          user_id: userObj.user_id,
        },
        jwt_secret
      );
      return res.status(200).send({
        jwt_token: jwt_token,
      });
    } catch (e) {
      console.log(e);
      return res.status(500).send({
        message: e.error_message,
      });
    }
  });

  app.post("/user", async function (req, res) {
    const reqData = req.body;
    let error_message = "";
    let status_code = 400;
    if (!reqData.fullname) {
      error_message = "Full name cannot be empty";
    } else if (!isValidEmail(reqData.email)) {
      error_message = "Please provide a valid email";
    } else if (!reqData.password) {
      error_message = "Password cannot be empty";
    }
    try {
      if (!error_message) {
        const getUserByEmailSql = "SELECT * FROM users WHERE user_email = ?";
        const getUserByEmailValues = [reqData.email];
        const getUserByEmailValuesResult = await executeQuery(
          getUserByEmailSql,
          getUserByEmailValues
        );
        if (getUserByEmailValuesResult.length) {
          error_message = `User already exists with email ${reqData.email}`;
          status_code = 409;
        }
      }

      if (error_message) {
        return res.status(status_code).send({
          error_message: error_message,
        });
      }

      const insertNewUserSql =
        "INSERT INTO users (user_fullname, user_email, user_password) VALUES (?, ?, ?)";
      const insertNewUservalues = [
        reqData.fullname,
        reqData.email,
        md5(reqData.password),
      ];
      const insertNewUserResult = await executeQuery(
        insertNewUserSql,
        insertNewUservalues
      );
      const getUserByIdSql = "SELECT * FROM users WHERE user_id = ?";
      const getUserByIdValues = [insertNewUserResult.insertId];
      const getUserByIdValuesResult = await executeQuery(
        getUserByIdSql,
        getUserByIdValues
      );
      const createdUser = getUserByIdValuesResult[0];
      delete createdUser.user_password;
      return res.status(200).send(createdUser);
    } catch (e) {
      return res.status(500).send({
        message: e.error_message,
      });
    }
  });

  app.put("/user", authenticate, async function (req, res) {
    const reqData = req.body;
    let error_message = "";
    let status_code = 400;
    let user_update_columns_sqls = [];
    let user_update_values = [];
    if (reqData.fullname != undefined && !reqData.fullname) {
      error_message = "Full name cannot be empty";
    }
    if (reqData.fullname) {
      user_update_columns_sqls.push("user_fullname = ?");
      user_update_values.push(reqData.fullname);
    }

    if (reqData.email != undefined && !isValidEmail(reqData.email)) {
      error_message = "Please provide a valid email";
    }
    if (reqData.email) {
      user_update_columns_sqls.push("user_email = ?");
      user_update_values.push(reqData.email);
    }
    if (reqData.password) {
      user_update_columns_sqls.push("user_password = ?");
      user_update_values.push(reqData.password);
    }

    if (reqData.password != undefined && !reqData.password) {
      error_message = "Password cannot be empty";
    }
    try {
      if (!error_message && reqData.email) {
        const getUserByEmailSql =
          "SELECT * FROM users WHERE user_email = ? AND user_id != ?";
        const getUserByEmailValues = [reqData.email, req.user.user_id];
        const getUserByEmailValuesResult = await executeQuery(
          getUserByEmailSql,
          getUserByEmailValues
        );
        if (getUserByEmailValuesResult.length) {
          error_message = `User already exists with email ${reqData.email}`;
          status_code = 409;
        }
      }

      if (!user_update_values.length) {
        error_message = `No info provided to be updated`;
        status_code = 400;
      }

      if (error_message) {
        return res.status(status_code).send({
          error_message: error_message,
        });
      }

      const updateUserSql = `UPDATE users SET ${user_update_columns_sqls.join(
        ", "
      )} WHERE user_id = ?`;
      const updateUservalues = user_update_values;
      updateUservalues.push(req.user.user_id);
      await executeQuery(updateUserSql, updateUservalues);
      const getUserByIdSql = "SELECT * FROM users WHERE user_id = ?";
      const getUserByIdValues = [req.user.user_id];
      const getUserByIdValuesResult = await executeQuery(
        getUserByIdSql,
        getUserByIdValues
      );
      const updatedUser = getUserByIdValuesResult[0];
      delete updatedUser.user_password;
      return res.status(200).send(updatedUser);
    } catch (e) {
      console.log(e);
      return res.status(500).send({
        message: e.error_message,
      });
    }
  });

  app.patch(
    "/user/profile_pic",
    authenticate,
    multerImageUpload.single("image"),
    async function (req, res) {
      try {
        if (req.error_message) {
          return res.status(400).send({
            error_message: req.error_message,
          });
        }
        const updateUserSql = `UPDATE users SET user_profile_pic_path = ? WHERE user_id = ?`;
        const updateUservalues = [req.file.filename];
        updateUservalues.push(req.user.user_id);
        await executeQuery(updateUserSql, updateUservalues);
        const getUserByIdSql = "SELECT * FROM users WHERE user_id = ?";
        const getUserByIdValues = [req.user.user_id];
        const getUserByIdValuesResult = await executeQuery(
          getUserByIdSql,
          getUserByIdValues
        );
        const updatedUser = getUserByIdValuesResult[0];
        delete updatedUser.user_password;
        return res.status(200).send(updatedUser);
      } catch (e) {
        console.log(e);
        return res.status(500).send({
          message: e.error_message,
        });
      }
    }
  );

  app.get("/user", authenticate, async function (req, res) {
    try {
      const getUserByIdSql = "SELECT * FROM users WHERE user_id = ?";
      let userId = req.user.user_id;
      const queryValues = [userId];
      const users = await executeQuery(getUserByIdSql, queryValues);
      const loggedInUser = users[0];
      delete loggedInUser.user_password;
      return res.status(200).send(loggedInUser);
    } catch (e) {
      console.log(e);
      return res.status(500).send({
        message: e.error_message,
      });
    }
  });
};
