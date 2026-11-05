# Documentacion tecnica - CommerCity

Indice de la documentacion versionada. El detalle de producto, entregas y
auditorias historicas vive en `docs/informes/`; aqui solo esta lo que se
mantiene al dia con el codigo.

## Empezar

| Documento | Para que sirve |
|---|---|
| [`../README.md`](../README.md) | Vision general, arquitectura cliente-servidor y puesta en marcha. |
| [`arquitectura.md`](arquitectura.md) | Interior del backend: pipeline, routers, contratos y donde vive cada pieza. |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Entorno, flujo de ramas y comandos antes del PR. |
| [`../SECURITY.md`](../SECURITY.md) | Como reportar una vulnerabilidad y que se considera secreto. |

## API y datos

| Documento | Para que sirve |
|---|---|
| [`api/openapi.json`](api/openapi.json) | Contrato OpenAPI 3.1 generado desde los esquemas Zod (fuente de verdad del contrato). |
| [`api/swagger.html`](api/swagger.html) | Swagger UI con el contrato embebido (funciona sin servidor). |
| [`api/index.html`](api/index.html) | Referencia Scalar. |
| [`api/entidades.md`](api/entidades.md) | Contratos de entrada por entidad, generados con `docs:entidades`. |
| [`api/inventario-endpoints.md`](api/inventario-endpoints.md) | Inventario de endpoints con auth, entrada y estado de validacion. |
| [`bd/modelo-datos.md`](bd/modelo-datos.md) | Tablas, columnas y migraciones aplicadas al esquema canonico. |
| [`informes/MATRIZ_RF_ENDPOINTS_2026-10-30.md`](informes/MATRIZ_RF_ENDPOINTS_2026-10-30.md) | Trazabilidad RF -> endpoint -> evidencia. |

## Operacion

| Documento | Para que sirve |
|---|---|
| [`guias/despliegue.md`](guias/despliegue.md) | Despliegue, respaldos y checklist previo a release. |
| [`guias/pruebas.md`](guias/pruebas.md) | Suites, cobertura y pruebas de integracion contra MySQL desechable. |
| [`guias/contribucion.md`](guias/contribucion.md) | Ramas, commits, docs-api y proteccion de `PREVIEW`. |
| [`guias/ramas-obsoletas.md`](guias/ramas-obsoletas.md) | Ramas y repos historicos que no deben usarse. |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de releases con evidencia real de cada corrida. |

## Regenerar la documentacion de API

```bash
cd backend
npm run docs:api        # docs/api/openapi.json + swagger.html se sirven desde el registro
npm run docs:entidades  # docs/api/entidades.md
```

El CI falla si `openapi.json` o `entidades.md` quedan desincronizados del
registro (`docs-api` job). No se editan a mano.

## Documentos que no se versionan

`docs/AVANCES/`, `docs/DRIVE/`, `docs/LAST VERSION/`, `docs/Meneses/`,
`docs/Audios/` y cualquier archivo con credenciales locales estan fuera del
repositorio por `.gitignore`. Nunca subas secretos, dumps con datos personales
ni keystores, aunque el archivo este dentro de `docs/`.
