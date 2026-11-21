import { Router } from "express";
import {
  showLoginPage,
  showSignupPage,
} from "../controllers/authPagesController.js";

const router = Router();

router.get("/login", showLoginPage);
router.get("/signup", showSignupPage);

export default router;
