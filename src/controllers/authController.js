import db from "../config/db.js";
import "../config/env.js"
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

  try {
    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json(errorResponse(102, "Email sudah terdaftar"));
    }

    await db.beginTransaction();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //inser new user
    const [newUser] = await db.execute(
      "INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)",
      [email, first_name, last_name, hashedPassword]
    );

    const userId = newUser.insertId;
    //create wallet for new user
    await db.execute(
      "INSERT INTO wallets (user_id, balance) VALUES (?, ?)",
      [userId, 0]
    );

    await db.commit();

    res.json(successResponse("Registrasi berhasil silahkan login"));
  } catch (err) {
    res.status(500).json(errorResponse(500, err.message));
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
    const [user] = await db.execute(
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
