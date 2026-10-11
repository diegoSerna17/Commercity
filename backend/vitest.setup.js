// TASK-1.3 (auditoria 2026-10-11): los tests deben correr en clones limpios,
// sin `.env` y sin secretos reales. Este setup:
//  1. fija NODE_ENV=test para que el runner sea determinista aunque la maquina
//     tenga NODE_ENV=production en el entorno (rate limits, validaciones);
//  2. define un JWT_SECRET de prueba cuando falta, para que utils/config.js no
//     aborte con process.exit(1) al importarse desde los modulos de auth.
// Jamas aplica a produccion: solo lo carga el runner de Vitest
// (test.setupFiles en package.json).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "jwt-secret-solo-para-pruebas-vitest-000000000000";
