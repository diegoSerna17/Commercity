const app = require("./app");

// Este archivo solo pone a escuchar la aplicacion.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API minima CommerCity escuchando en http://localhost:${PORT}`);
});
