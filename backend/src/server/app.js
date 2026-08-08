import express from "express";
import cors from "cors";

import router from "./routes/routes.js";
import carritoRouter from "./routes/carrito.routes.js";
import usuariosRouter from "./routes/usuarios.routes.js";
import historialRouter from "./routes/historial.routes.js";
import productosRouter from "./routes/productos.routes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/", router);
app.use("/api/carrito", carritoRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/historial", historialRouter);
app.use("/api", productosRouter);

export default app;
