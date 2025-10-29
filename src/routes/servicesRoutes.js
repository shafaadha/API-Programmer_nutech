import express from "express";
import { getServiceList } from "../controllers/serviceController.js";
import { verifyToken as authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getServiceList);

export default router;