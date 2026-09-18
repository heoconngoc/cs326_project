import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to Lost n Found Main Page");
});
// send welcome message

app.get("/lost-items", (req, res) => {
  res.send("Lost Items Page")
})
// get lost items

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
