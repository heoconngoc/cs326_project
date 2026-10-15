import { connectDB } from "./config/database.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exitCode = 1;
}
