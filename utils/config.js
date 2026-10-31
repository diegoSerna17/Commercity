require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("FATAL: defina JWT_SECRET de al menos 32 caracteres en .env");
  process.exit(1);
}

const JWT_ISSUER = process.env.JWT_ISSUER || "commercity-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "commercity-clients";

module.exports = { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE };
