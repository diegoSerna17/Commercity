import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./routes/routes.js";
import carritoRouter from "./routes/carrito.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use("/", router);
app.use("/api/carrito", carritoRouter);

app.listen(PORT, () => {
    console.log("Servidor creado con puerto http://localhost:3000");
});