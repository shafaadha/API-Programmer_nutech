import { error } from "console";
import db from "../config/db.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

export const getBalance = async (req, res) => {
  try {
    const [users] = await db.execute("SELECT id FROM users WHERE email = ?", [
      req.user.email,
    ]);

    if (users.length === 0) {
      return res.status(404).json(errorResponse(404, "User tidak ditemukan"));
    }

    const userId = users[0].id;

    const [wallets] = await db.execute(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );

    if (wallets.length === 0) {
      return res.status(404).json(errorResponse(404, "Wallet tidak ditemukan"));
    }

    console.log("UserId:", userId, "Balance:", wallets[0].balance);

    return res
      .status(200)
      .json(
        successResponse("Get Balance Berhasil", { balance: wallets[0].balance })
      );
  } catch (error) {
    console.error("getBalance error:", error);
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

export const topUp = async (req, res) => {
  try {
    const email = req.user.email;
    const { top_up_amount } = req.body;

    if (
      !top_up_amount ||
      typeof top_up_amount !== "number" ||
      top_up_amount <= 0
    ) {
      return res
        .status(400)
        .json(
          errorResponse(
            102,
            "Parameter amount hanya boleh angka dan tidak boleh lebih kecil dari 0"
          )
        );
    }

    await db.beginTransaction();

    const [users] = await db.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    const [wallets] = await db.execute(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [users[0].id]
    );

    const newBalance = wallets[0].balance + top_up_amount;

    await db.execute("UPDATE wallets SET balance = ? WHERE user_id = ?", [
      newBalance,
      users[0].id,
    ]);

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    await db.execute(
      "INSERT INTO transactions (user_id, transaction_type, total_amount, invoice_number) VALUES (?, ?, ?, ?)",
      [users[0].id, "TOPUP", top_up_amount, invoiceNumber]
    );
    await db.commit();
    return res.json(
      successResponse("Top up Balance berhasil", { balance: newBalance })
    );
  } catch (error) {
    await db.rollback();
    console.error("Error in topUp:", error);
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

export const createTransaction = async (req, res) => {
  const { service_code } = req.body;
  const userEmail = req.user.email;
  if (!service_code) {
    return res
      .status(400)
      .json(errorResponse(102, "Parameter service_code harus diisi"));
  }

  try {
    const [user] = await db.execute("SELECT id FROM users WHERE email = ?", [
      userEmail,
    ]);
    if (user.length === 0) {
      return res.status(404).json(errorResponse(102, "User tidak ditemukan"));
    }

    const [balance] = await db.execute(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [user[0].id]
    );

    if (balance.length === 0) {
      return res.status(404).json(errorResponse(102, "Wallet tidak ditemukan"));
    }
    const [service] = await db.execute(
      "SELECT * FROM services WHERE service_code = ?",
      [service_code]
    );

    if (service.length === 0) {
      return res
        .status(404)
        .json(errorResponse(102, "Service atau Layanan tidak ditemukan"));
    }

    if (balance[0].balance < service[0].service_tariff) {
      return res.status(400).json(errorResponse(102, "Saldo tidak mencukupi"));
    }
    await db.beginTransaction();

    const newBalance = balance[0].balance - service[0].service_tariff;
    await db.execute("UPDATE wallets SET balance = ? WHERE user_id = ?", [
      newBalance,
      user[0].id,
    ]);

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    await db.execute(
      "INSERT INTO transactions (user_id, service_code, transaction_type, total_amount, invoice_number) VALUES (?, ?, ?, ?, ?)",
      [
        user[0].id,
        service_code,
        "PAYMENT",
        service[0].service_tariff,
        invoiceNumber,
      ]
    );

    await db.commit();

    return res.status(200).json(
      successResponse("Transaksi berhasil", {
        invoice_number: invoiceNumber,
        service_code: service_code,
        service_name: service[0].service_name,
        transaction_type: "PAYMENT",
        total_amount: service[0].service_tariff,
        created_on: new Date().toISOString(),
      })
    );
  } catch (error) {
    await db.rollback();
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

export const getTransactions = async (req, res) => {
  const userEmail = req.user.email;
  const { limit, offset = 0 } = req.query;
  try {
    const [user] = await db.execute("SELECT id FROM users WHERE email = ?", [
      userEmail,
    ]);

    if (user.length === 0) {
      return res.status(404).json(errorResponse(102, "User tidak ditemukan"));
    }

    let query = `
      SELECT 
        t.invoice_number,
        t.transaction_type,
        CASE 
          WHEN t.transaction_type = 'TOPUP' THEN 'Top Up balance'
          ELSE s.service_name
        END AS description,
        t.total_amount,
        t.created_on
      FROM transactions t
      LEFT JOIN services s ON t.service_code = s.service_code
      WHERE t.user_id = ?
      ORDER BY t.created_on DESC
    `;

    const params = [user[0].id];

    if (limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

    const [transactions] = await db.execute(query, params);

    return res
      .status(200)
      .json(
        successResponse("Get Transactions Berhasil", {
          offset,
          limit,
          records: transactions,
        })
      );
  } catch (error) {
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};
