/**
 * M-24: URL de la API por entorno.
 * Se carga ANTES de api.js. Solo se define cuando la app corre en el
 * navegador de PC (live-server en el puerto 8080); en el emulador Android
 * o en build nativo se mantiene el default de api.js (http://10.0.2.2:3000).
 * Para un dispositivo fisico, definir window.COMMERCITY_API_URL con la
 * IP-LAN del equipo antes de api.js (ver README de apps/movil).
 */
(function () {
  if (window.COMMERCITY_API_URL) return;
  if (String(location.port) === "8080") {
    window.COMMERCITY_API_URL = "http://localhost:3000";
  }
})();
