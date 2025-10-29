import express from "express";
import { getBanner } from "../controllers/informationController.js";

const router = express.Router();

router.get("/", getBanner);

export default router;
