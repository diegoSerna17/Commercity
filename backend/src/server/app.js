import express from "express";
import cors from "cors";

import router from "./routes/routes.js";
import carritoRouter from "./routes/carrito.routes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/", router);
app.use("/api/carrito", carritoRouter);

export default app;
