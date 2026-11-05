# Seguridad - CommerCity

## Versiones soportadas

Solo la ultima version publicada en `PREVIEW`/`main` recibe correcciones de
seguridad. El proyecto es academico y no mantiene ramas antiguas.

| Version | Soporte |
|---|---|
| 1.4.x | Si |
| < 1.4 | No |

## Como reportar una vulnerabilidad

1. **No abras un issue publico** ni publiques el detalle en PRs, chats o
   capturas: la plataforma maneja sesiones y datos personales.
2. Usa **Security > Advisories > Report a vulnerability** en el repositorio de
   GitHub (canal privado con los mantenedores).
3. Incluye: version afectada, endpoint o archivo, pasos de reproduccion,
   impacto y, si es posible, una prueba de concepto **sin datos reales**.
4. Si el hallazgo ya quedo expuesto en un hilo o en el historial de git, se
   considera comprometido: rota el secreto y no sigas usando esa version.

## Alcance

- Inyeccion SQL, XSS, CSRF/SSRF, IDOR y control de acceso por rol/ownership.
- Manejo de sesiones (JWT en cookie `httpOnly`, `token_version`, revocacion).
- Exposicion de secretos, dumps con datos personales o archivos `uploads/`.
- Validacion de contratos (Zod) y subida de archivos (magic bytes, tamano).
- Dependencias vulnerables: Dependabot abre PRs semanales; `npm audit` corre en CI.

## Fuera de alcance

- Entornos locales o de desarrollo con valores de relleno.
- Ingenieria social y pruebas de denegacion de servicio.
- El `README.md` historico con cifras anteriores (salvo que revele secretos).

## Practicas del repositorio

- Nunca versionar `.env`, `*.pem`, `*.key`, `credentials*`, keystores ni dumps.
- Los secretos se rotan si aparecen en un commit, una captura o un log.
- Las pruebas usan mocks o una BD desechable (`TEST_DB_*`); nunca la BD compartida.
