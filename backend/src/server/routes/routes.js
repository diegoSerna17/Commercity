import { Router } from "express";
import { getUsuarios } from "../controllers/usuarios.controllers.js";

const router = Router();


router.get("/", getUsuarios);

export default router;