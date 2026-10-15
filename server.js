import express from "express";
import { connectDB } from "./config/database.js";

const app = express();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Welcome to Lost n Found Main Page");
});
// send welcome message

app.get("/lost-items", (req, res) => {
  res.send("Lost Items Page")
})
// get lost items

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exitCode = 1;
}
