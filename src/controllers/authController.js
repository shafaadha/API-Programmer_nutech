import db from "../config/db.js";
import "../config/env.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    let missingField = "";
    if (!email) missingField = "email";
    else if (!first_name) missingField = "first_name";
    else if (!last_name) missingField = "last_name";
    else if (!password) missingField = "password";

    return res
      .status(400)
      .json(errorResponse(102, `Parameter ${missingField} harus diisi`));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json(errorResponse(102, "Parameter email tidak sesuai format"));
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json(errorResponse(102, "Password length minimal 8 karakter"));
  }

  const connection = await db.getConnection();

  try {
    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json(errorResponse(102, "Email sudah terdaftar"));
    }

    await connection.beginTransaction();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const profileImage = "default-profile.png";

    const [newUser] = await connection.execute(
      "INSERT INTO users (email, first_name, last_name, password, profile_image) VALUES (?, ?, ?, ?, ?)",
      [email, first_name, last_name, hashedPassword, profileImage]
    );

    const userId = newUser.insertId;

    await connection.execute(
      "INSERT INTO wallets (user_id, balance) VALUES (?, ?)",
      [userId, 0]
    );

    await connection.commit();
    res.json(successResponse("Registrasi berhasil silakan login"));
  } catch (err) {
    await connection.rollback();
    res.status(500).json(errorResponse(500, err.message));
  } finally {
    connection.release();
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    let missingField = "";
    if (!email) missingField = "email";
    else if (!password) missingField = "password"; 
    return res
      .status(400)
      .json(errorResponse(102, `Parameter ${missingField} harus diisi`));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json(errorResponse(102, "Parameter email tidak sesuai format"));
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json(errorResponse(102, "Password length minimal 8 karakter"));
  }

  try {
    const [user] = await connection.execute(
      "SELECT*FROM users WHERE email=?",
      [email]
    );
    if (user.length === 0) {
      return res
        .status(401)
        .json(errorResponse(103, "Email atau password salah"));
    }

    const isMatch = await bcrypt.compare(password, user[0].password);


    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "12h" });

    return res.json(successResponse("Login sukses", { token }));
  } catch (err) {
    res.status(500).json(errorResponse(500, err.message));
  }
};
