import express from "express";
import { register, login } from "../controllers/authController.js";
import {
  updateProfile,
  upload,
  uploadProfileImage,
  getProfile,
} from "../controllers/profileController.js";
import { verifyToken as authMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => {
  getProfile(req, res);
});
router.put("/profile/image", authMiddleware, (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        status: err.code || 102,
        message: err.message,
        data: null,
      });
    }
    uploadProfileImage(req, res);
  });
});
router.put("/update", authMiddleware, updateProfile);

export default router;
