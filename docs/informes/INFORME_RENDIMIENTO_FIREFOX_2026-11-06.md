# Evidencia de rendimiento en Firefox (500k productos)

**Fecha:** 2026-11-06
**Solicitud del instructor:** medir en Firefox (Red -> XHR) el tiempo de respuesta y el tamano transferido.
**Version medida:** 1.4.3

## Entorno

| Elemento | Valor |
|---|---|
| Navegador | Firefox 159.0 (build de Playwright, Gecko) |
| App | `http://localhost:5173` (Vite) |
| API | `http://localhost:3000` |
| MySQL | 8.4.13 LTS portable, `127.0.0.1:3306`, base `commercity_dev` |
| Datos | 500.000 productos sembrados; 490.081 visibles en catalogo |
| Herramienta | `tools/medir-firefox.mjs` con Playwright 1.65.0 |

La base compartida no se toco. Los datos de prueba se limpiaron al terminar.

## Metodo

1. Playwright abre Firefox y carga la app real.
2. Ejecuta 5 peticiones `GET` por endpoint desde el contexto del navegador.
3. Graba un HAR sin cuerpos (`content: "omit"`) y lee Resource Timing.
4. Del HAR se extraen TTFB (`timings.wait`), cuerpo (`bodySize`) y cabeceras (`headersSize`).

Nota: al ser peticiones cross-origin sin `Timing-Allow-Origin`, el Resource Timing del navegador devuelve `transferSize: 0` y detalles de red en cero. Por eso el tamano y el TTFB se toman del HAR, que si los registra a nivel de red. La duracion total si coincide con `performance.now()`.

## Resultados

| Endpoint | p50 total | p95 total | TTFB p50 | Cuerpo | Cabeceras |
|---|---:|---:|---:|---:|---:|
| Catalogo pagina 1 | 178 ms | 222 ms | 173,23 ms | 7.116 B | 1.040 B |
| Catalogo pagina 50 | 185 ms | 210 ms | 176,99 ms | 7.116 B | 1.040 B |
| Busqueda `nombre=a` | 2.878 ms | 3.050 ms | 2.871,62 ms | 1.741 B | 1.039 B |
| Categorias | 7 ms | 34 ms | 1,54 ms | 528 B | 1.044 B |
| Vendedores | 9 ms | 30 ms | 4,12 ms | 579 B | 1.039 B |

Transferido total por peticion (cuerpo + cabeceras):

- Catalogo: ~8,0 KB.
- Busqueda: ~2,7 KB.
- Categorias: ~1,5 KB.
- Vendedores: ~1,6 KB.

Las cabeceras pesan cerca de 1 KB por las cabeceras de seguridad de helmet.

## Comparacion con la medicion por script (Node)

| Endpoint | Node p50 (500k) | Firefox p50 |
|---|---:|---:|
| Catalogo pagina 1 | 293 ms | 178 ms |
| Catalogo pagina 50 | 296 ms | 185 ms |
| Busqueda | 3.785 ms | 2.878 ms |
| Categorias | 2 ms | 7 ms |

La diferencia del catalogo se explica porque el cliente Node mide con concurrencia 5 y el navegador con peticiones secuenciales; el orden de magnitud es el mismo.

## Evidencia generada

- `docs/informes/rendimiento/firefox-2026-11-06T23-04-36-624Z.json`: resumen y muestras por peticion.
- `docs/informes/rendimiento/firefox-2026-11-06T23-04-36-624Z.har`: HAR sin cuerpos.

## Limitaciones

- Playwright usa su propio build de Firefox, no el Firefox instalado. Los numeros son de Gecko y validos, pero la captura visual de la pestana Red del Firefox normal queda a cargo del usuario.
- Medicion en localhost, sin latencia de red del SENA.
- Sin sesion iniciada: solo endpoints publicos.
- La busqueda sigue siendo el cuello de botella por `LIKE '%texto%'`; el HAR confirma que el tiempo esta en la espera del servidor (TTFB 2.871 ms), no en la transferencia (1,7 KB).

## Pendiente

- Captura manual de la pestana Red en Firefox para el informe visual.
- Repetir desde la red del SENA.
- Video de respaldo de la demo.
