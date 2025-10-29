import db from "../config/db.js";
import multer from "multer";
import path from "path";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Format Image tidak sesuai");
    error.code = 120;
    return cb(error);
  }
  cb(null, true);
};

export const upload = multer({ storage: storage, fileFilter: fileFilter });

export const getProfile = async (req, res) => {
  const email = req.user.email;
  try {
    const [user] = await db.execute("SELECT*FROM users WHERE email = ?", [
      email,
    ]);
    return res.status(200).json(successResponse("Sukses", { email, first_name: user[0].first_name, last_name: user[0].last_name, profile_image: user[0].profile_image }));
} catch (error) {
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(errorResponse(102, "File image harus diupload"));
    }
    const email = req.user.email;
    const protocol = req.protocol;
    const host = req.get("host");
    const imageUrl = `${protocol}://${host}/${req.file.path}`;

    await db.execute("UPDATE users SET profile_image = ? WHERE email = ?", [
      imageUrl,
      email,
    ]);

    const [user] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return res.status(200).json(
      successResponse("Update Profile Image berhasil", {
        email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: imageUrl,
      })
    );
  } catch (error) {
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

export const updateProfile = async (req, res) => {
  const { first_name, last_name } = req.body;
  const email = req.user.email;

  if (!first_name || !last_name) {
    let missingField = "";
    if (!first_name) missingField = "first_name";
    else if (!last_name) missingField = "last_name";

    return res
      .status(400)
      .json(errorResponse(102, `Parameter ${missingField} harus diisi`));
  }

  try {
    const [result] = await db.execute(
      "UPDATE users SET first_name = ?, last_name = ? WHERE email = ?",
      [first_name, last_name, email]
    );
    const [user] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return res.status(200).json(
      successResponse("Update Profile berhasil", {
        email,
        first_name: user[0].first_name,
        last_name: user[0].last_name,
        profile_image: user[0].profile_image,
      })
    );
  } catch (error) {
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};
