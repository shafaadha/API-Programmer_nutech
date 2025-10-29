import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responseFormatter.js";
const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse(108, "Token tidak valid atau kadaluarsa"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json(errorResponse(108, "Token tidak valid atau kadaluarsa"));
  }
};