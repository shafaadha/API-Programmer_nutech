import express from "express";
const app = express();
const port = process.env.PORT || 3000;
import "./src/config/env.js"
import authRoutes from "./src/routes/authRoutes.js";
import { getBanner } from "./src/controllers/informationController.js";
import servicesRoutes from "./src/routes/servicesRoutes.js";
import { verifyToken } from "./src/middlewares/authMiddleware.js";
import { createTransaction, getTransactions, getBalance, topUp } from "./src/controllers/transactionController.js";
app.use(express.json());

app.use("/uploads", express.static("uploads"));
//Routes
app.use("/", authRoutes);

//Routes Information
app.get("/banner", getBanner);
//Routes services
app.use("/services", servicesRoutes);

//routes transaction
app.get("/balance", verifyToken, getBalance);
//route topup
app.post("/topup", verifyToken, topUp);
//route transaction
app.post("/transaction", verifyToken, createTransaction);
app.get("/transaction/history", verifyToken, getTransactions);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
