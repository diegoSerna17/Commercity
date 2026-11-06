# Informe de rendimiento con 500.000 registros

**Fecha:** 2026-11-06
**Rama:** `perf/rendimiento-2026-11`
**Version medida:** 1.4.3 (count sin JOINs + `idx_productos_catalogo`)

## Entorno y datos

| Elemento | Valor |
|---|---|
| MySQL | 8.4.13 LTS portable, `127.0.0.1:3306`, base `commercity_dev` |
| Node.js | v24.22.1 |
| Backend | `npm start`, puerto 3000 |
| Productos sembrados | 500.000 (lotes de 5.000, 39,8 s) |
| Total en tabla | 500.082 (incluye 82 del seed) |
| Visibles en catalogo | 490.081 (excluye agotados y pausados) |

La base compartida no se toco. La siembra usa el prefijo `PERF-` y se limpia al final.

## Metodo

- 50 peticiones por endpoint, concurrencia 5, 5 de calentamiento, solo `GET` publicos.
- `EXPLAIN ANALYZE` para las consultas del catalogo y la busqueda.
- Rate limit: `/api/seguidores` tiene 30/min, por eso 25 de sus 50 peticiones devuelven 429 por diseno.

## Resultados de endpoints (500k)

| Endpoint | p50 | p95 | p99 | RPS |
|---|---:|---:|---:|---:|
| `/health` | 6.94 ms | 29.81 ms | 37.59 ms | 490.7 |
| Catalogo pagina 1 | 293.48 ms | 335.16 ms | 341.78 ms | 16.7 |
| Catalogo pagina 50 | 296.21 ms | 320.62 ms | 327.32 ms | 16.7 |
| Busqueda `nombre=a` | 3784.73 ms | 3946.36 ms | 3968.79 ms | 1.3 |
| Categorias | 2.23 ms | 4.01 ms | 4.09 ms | 2007.6 |
| Vendedores | 7.83 ms | 12.28 ms | 12.48 ms | 567.6 |
| Detalle de producto | 9.01 ms | 10.51 ms | 10.69 ms | 531.7 |
| Seguidores (contadores) | 5.17 ms | 27.07 ms | 27.98 ms | 504.4 |
| Calificaciones de vendedor | 12.18 ms | 17.02 ms | 17.75 ms | 392.6 |

## Consultas medidas (500k)

| Consulta | Tiempo |
|---|---:|
| `COUNT(*)` con JOIN a categorias y usuarios | 3.747,4 ms |
| `COUNT(*)` sin JOIN, con `idx_productos_catalogo` | 310,5 ms |
| Lista `ORDER BY id DESC LIMIT 20 OFFSET 0` | 3,2 ms |
| Lista `ORDER BY id DESC LIMIT 20 OFFSET 980` | 2,3 ms |
| `COUNT(*)` con `nombre LIKE '%a%'` | 2.050,8 ms |
| Lista con `nombre LIKE '%a%'` | 851,7 ms |

El `EXPLAIN ANALYZE` confirma que el count sin JOIN se resuelve como covering index sobre 490.081 filas y el count con JOIN hace 980.162 lookups adicionales.

## Comparacion 100k vs 500k

| Metrica | 100k | 500k | Escala |
|---|---:|---:|---:|
| Catalogo p50 | 53,05 ms | 293,48 ms | ~5,5x |
| Catalogo p95 | 80,72 ms | 335,16 ms | ~4,2x |
| Busqueda p50 | 685,34 ms | 3.784,73 ms | ~5,5x |
| Count sin JOIN | 36,7 ms | 310,5 ms | ~8,5x |

El catalogo escala de forma casi lineal con el volumen porque el `COUNT` recorre todo el indice. La lista paginada no escala con el volumen (2-6 ms), gracias al indice y al `ORDER BY id`.

## Lectura de resultados

1. **Catalogo:** 293 ms de p50 y 335 ms de p95 con 500k. Esta apenas por encima del objetivo de 300 ms definido para 100k. Para produccion con este volumen conviene cachear el total.
2. **Busqueda:** 3,8 s de p50. Es el problema real: `LIKE '%texto%'` no puede usar indice. No se corrige sin cambiar la semantica (FULLTEXT encuentra palabras, no subcadenas) o sin un motor de busqueda aparte.
3. **Detalle, categorias, vendedores y calificaciones:** siguen en milisegundos; no les afecta el volumen del catalogo.
4. **Paginas profundas:** el `LIMIT/OFFSET` se mantiene barato hasta offset 980. Para offsets de cientos de miles conviene keyset pagination (`WHERE id < ultimo`).

## Recomendaciones

- **Cachear el total del catalogo** por combinacion de filtros con TTL de 30-60 s; elimina el 90 % del costo del endpoint.
- **Definir la busqueda:** si se acepta semantica por palabras, migrar a `MATCH ... AGAINST` con FULLTEXT; si se necesita subcadena, evaluar un indice de trigramas o un motor externo.
- **Keyset pagination** para paginas profundas cuando el offset supere unos miles.
- **No aplicar** indices adicionales sin medir: el indice actual ya resuelve el count; el problema es el volumen recorrido, no la falta de indice.

## Evidencia

- `docs/informes/rendimiento/medicion-local-500k-2026-11-06.json`
- `docs/informes/rendimiento/medicion-local-optimizada-2026-11-06.json` (100k)
- `docs/informes/INFORME_RENDIMIENTO_2026-11-06.md` (100k)
- `docs/informes/INFORME_RENDIMIENTO_FIREFOX_2026-11-06.md` (Firefox 159.0 con HAR)
- `docs/informes/rendimiento/firefox-2026-11-06T23-04-36-624Z.json` y `.har`

## Pendiente

- Medicion en Firefox con HAR y capturas (las toma el usuario).
- Medicion desde la red del SENA o hotspot.
- Video de respaldo de la demo.
- Decision sobre cache del total y semantica de busqueda.
