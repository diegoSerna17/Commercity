// Inicializacion de la referencia Scalar (archivo externo para cumplir
// la CSP sin 'unsafe-inline': script-src 'self' + CDN pineado).
(function () {
  var aviso = document.getElementById("aviso");
  if (typeof Scalar === "undefined" || !Scalar.createApiReference) {
    return; // Sin Scalar: el aviso queda visible (fallback honesto).
  }
  Scalar.createApiReference("#app", { url: "./openapi.json" });
  if (aviso) aviso.style.display = "none";
})();
