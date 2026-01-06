const express = require("express");
const app = express();

app.use(express.json());

app.use(require("./routes/products"));
app.use(require("./routes/alerts"));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
