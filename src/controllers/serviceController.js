import db from "../config/db.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

export const getServiceList = async (req, res) => {
  try {
    const [services] = await db.execute(
      "SELECT service_code, service_name, service_icon, service_tariff FROM services"
    );
    return res.status(200).json(successResponse("Sukses", services));
  } catch (error) {
    return res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};
