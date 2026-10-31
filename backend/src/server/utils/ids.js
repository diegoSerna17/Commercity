// A4 (P2 auditoria 2026-10-05): utilidades de IDs en capa comun.
// Antes validarId vivia en admin/admin.utils.js y reportes.controllers.js
// (capa usuario) la importaba desde admin: inversion de capas.
export const validarId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;
