
import session from "express-session";
import MongoStore from "connect-mongo";

export const createSessionMiddleware = () => {
  const isTest = process.env.NODE_ENV === "test";
  const isProduction = process.env.NODE_ENV === "production";

  const secret =
    process.env.SESSION_SECRET ||
    (isProduction ? undefined : "dev-secret-change-in-production");

  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }

  const options = {
    name: "cs326.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  if (!isTest) {
    const mongoUrl = process.env.MONGODB_URI;

    if (!mongoUrl) {
      throw new Error("MONGODB_URI is required");
    }

    options.store = MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
      ttl: 24 * 60 * 60,
    });
  }

  return session(options);
};
