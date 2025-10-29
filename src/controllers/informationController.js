import db from "../config/db.js";
import { successResponse, errorResponse } from "../utils/responseFormatter.js";

export const getBanner = async(req, res) => {
    try {
        const [banners] = await db.execute("SELECT banner_name, banner_image, description FROM banners");
       return res.status(200).json(successResponse("Sukses", banners));
    } catch (error) {
        return res.status(500).json(errorResponse(500, "Internal Server Error"));
    }
};
