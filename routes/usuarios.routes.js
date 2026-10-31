const express = require("express");
const router = express.Router();
const { register, login, me } = require("../controllers/usuarios.controller");
const { authRequired } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../schemas/auth.schemas");

// Publicas
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protegida: exige token
router.get("/me", authRequired, me);

module.exports = router;
