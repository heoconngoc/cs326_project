import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome Lost n Found Main Page");
});

app.get("/lost-items", (req, res) => {
  res.send("Lost Items Page")
})

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
