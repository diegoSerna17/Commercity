# AGENTS.md — CommerCity

Punto de entrada para cualquier agente de codigo que trabaje en este repositorio.

## Leer antes de actuar

1. [docs/MEMORIA_PROYECTO.md](docs/MEMORIA_PROYECTO.md) — contexto estable: arquitectura,
   decisiones cerradas, estado verificado, pendientes y lecciones.
2. `.trae/rules/` — convenciones obligatorias (memoria, documentacion de cambios, revision
   de requerimientos, seguridad de API, SQL, testing, estructura del backend).
3. `.trae/AGENTS.md` — reglas del orquestador y tabla de ruteo a agentes especializados.

## Reglas no negociables

- Fuente unica de requerimientos: documento oficial del Director, version final 2026-08-20.
  Sin RF y sin aval no se implementa; se documenta y se agenda.
- Una sola API, tres clientes (web, movil, escritorio). Mismo servidor, mismo contrato
  `{ success, data }` / `{ success, error }`; solo cambia la URL base y la allow-list de CORS.
- Prohibido el DELETE fisico de historicos: borrado logico.
- `productos.estado` es STORED GENERATED: se lee, nunca se inserta ni se actualiza.
- Precio publicado CON IVA incluido; subtotal sin IVA y comisiones 90/10 calculadas en backend.
- Sin secretos en prompts, logs, commits ni archivos versionados (`.env`, `*.pem`, `credentials*`).
- `git push` a `main`/`master` solo con confirmacion explicita del usuario; nunca `--force`,
  nunca `git add .`.
- Sin comandos en servidores remotos: entregarlos redactados para que el usuario los copie.
- Cifras de pruebas y cobertura: solo las del CHANGELOG o de una corrida pegada por el usuario.

## Cierre de cada cambio

1. Entrada en `docs/CHANGELOG.md` con fecha real del sistema y RF del documento 2026-08-20.
2. Actualizar `docs/MEMORIA_PROYECTO.md` si la decision es estable o cambia el estado.
3. Commit por cambio logico con mensaje `TAG: descripcion`; push a la rama de trabajo.

Idioma de trabajo: espanol, sin emojis.
