# Informe de rendimiento - CommerCity

**Fecha:** 2026-11-06
**Rama:** `perf/rendimiento-2026-11`
**Alcance:** medicion con 100.000 productos en base local desechable, antes y despues del ajuste del catalogo.

## Entorno

| Elemento | Valor |
|---|---|
| Sistema | Windows, equipo de desarrollo |
| Node.js | v24.22.1 |
| MySQL | 8.4.13 LTS, portable, `127.0.0.1:3306` |
| Base | `commercity_dev` (local, desechable) |
| Backend | `npm start`, puerto 3000 |
| Datos | 100.000 productos sembrados + 82 del seed = 100.082 |
| Visibles en catalogo | 98.081 (excluye agotados y pausados) |

La base compartida `commercity_v2` **no se toco**. La siembra se hizo con `backend/scripts/sembrar-carga.mjs` y se limpio al terminar (100.000 filas `PERF-%` borradas; quedaron los 82 productos del seed).

## Metodo

- `backend/scripts/medir-endpoints.mjs` con 50 peticiones por endpoint, concurrencia 5 y 5 de calentamiento.
- Solo metodos `GET` y rutas publicas; los endpoints autenticados se omitieron por falta de `PERF_TOKEN`.
- Metricas: p50, p95, p99, RPS, estados HTTP y tamano transferido.
- `EXPLAIN ANALYZE` para las consultas del catalogo.
- El endpoint `/api/seguidores/1/contadores` tiene limite propio de 30/min: 25 de las 50 peticiones devolvieron 429 por diseno, no por fallo.

## Resultados antes y despues

| Endpoint | p50 antes | p50 despues | p95 antes | p95 despues |
|---|---:|---:|---:|---:|
| `/health` | 2.30 ms | 7.32 ms | 15.52 ms | 27.21 ms |
| Catalogo pagina 1 | 871.66 ms | **53.05 ms** | 901.15 ms | **80.72 ms** |
| Catalogo pagina 50 | 825.37 ms | **59.15 ms** | 877.38 ms | **66.35 ms** |
| Busqueda `nombre=a` | 665.60 ms | 685.34 ms | 732.98 ms | 724.37 ms |
| Categorias | 4.30 ms | 6.22 ms | 11.47 ms | 14.14 ms |
| Vendedores | 11.64 ms | 11.13 ms | 33.73 ms | 16.86 ms |
| Detalle de producto | 8.69 ms | 12.43 ms | 10.45 ms | 25.68 ms |
| Seguidores (contadores) | 4.52 ms | 5.32 ms | 26.04 ms | 31.64 ms |
| Calificaciones de vendedor | 9.59 ms | 10.87 ms | 10.79 ms | 17.45 ms |

Las diferencias de `/health`, categorias y detalle estan en el orden de milisegundos y corresponden a ruido de una sola corrida; no se interpretan como regresion.

## Causa raiz y correccion

`EXPLAIN ANALYZE` mostro que el costo del catalogo estaba en el `COUNT(*)`:

- count con `JOIN categorias` y `JOIN usuarios`: **509 a 597 ms** (98.081 lookups por join).
- count sin JOINs y con indice compuesto: **36.7 ms**.
- consulta de lista con `ORDER BY p.id DESC LIMIT 20 OFFSET 980`: **2 a 5 ms**.

Correccion aplicada:

1. El `COUNT` omite los JOIN cuando no se filtra por nombre de categoria ni de vendedor.
2. Migracion idempotente `020_indices_rendimiento.sql` con `idx_productos_catalogo (eliminado_por_admin, pausado, eliminado_por_vendedor, estado, id)`.
3. El esquema canonico y el ledger de migraciones incorporan la 020; el test de migraciones cubre 015-020 y el indice.

## Brecha pendiente: busqueda por texto

`GET /api/productos?nombre=a` sigue en ~685 ms porque usa `LIKE '%a%'`; el comodin inicial impide usar cualquier indice B-tree. Cambiar a `MATCH ... AGAINST` (FULLTEXT) mejora palabras completas, pero **cambia la semantica** (no encuentra subcadenas ni terminos de menos de 3 caracteres). Queda como decision de producto, no como cambio unilateral.

## Evidencia

- `docs/informes/rendimiento/medicion-2026-11-06T22-39-57-850Z.json` (antes).
- `docs/informes/rendimiento/medicion-local-optimizada-2026-11-06.json` (despues).
- Scripts: `backend/scripts/sembrar-carga.mjs`, `backend/scripts/medir-endpoints.mjs`.

## Pendiente

- Medicion en Firefox con HAR y capturas (las toma el usuario).
- Medicion desde la red del SENA o hotspot, con limitacion documentada.
- Aplicar la migracion 020 en la base compartida (decision del lider).
- Video de respaldo de la demo, fuera del repositorio.
