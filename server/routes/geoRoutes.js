import express from "express";
import { reverseGeocode, searchGeocode } from "../controller/geoController.js";

const router = express.Router();

router.get("/reverse", reverseGeocode);
router.get("/search", searchGeocode);

export default router;
