---
type: "query"
date: "2026-09-28T03:55:56.734286+00:00"
question: "How does pool connect to schema tables usuarios pedidos detalle_pedidos pagos_simulados?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["pool", "schema_commercity.sql", "detalle_pedidos", "pagos_simulados", "usuarios"]
---

# Q: How does pool connect to schema tables usuarios pedidos detalle_pedidos pagos_simulados?

## Answer

Expanded via vocab: [pool, usuarios, pedidos, detalle, pagos, productos, schema, carrito, cuenta]. pool backend/src/server/config/db.js L10 degree 23 community 0 imported by 12+ controllers but NO path to schema tables in graph (pool->usuarios and pool->pedidos both No path found) because SQL strings in JS are not extracted as edges. Schema side: schema_commercity.sql contains 18 tables; detalle_pedidos L162 references usuarios/productos/pedidos; pagos_simulados is split: schema node community 14 vs migration-008 node community 39 degree 1 isolated. Gap documented, not hallucinated.

## Outcome

- Signal: useful

## Source Nodes

- pool
- schema_commercity.sql
- detalle_pedidos
- pagos_simulados
- usuarios