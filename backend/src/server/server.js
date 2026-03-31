import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./routes/routes.js";
const app = express();
const PORT = 3000

app.use(express.json());
app.use(cors());
app.use("/", router);

app.listen(PORT, () => {
    console.log("Servidor creado con puerto http://localhost:3000");
});