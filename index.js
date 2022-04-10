const express = require("express");
const initializeUserRoutes = require("./routes/users.js");

const app = express();
app.use(express.json());
initializeUserRoutes(app);
app.listen(3000);

console.log("app is listening on http://localhost:3000");
