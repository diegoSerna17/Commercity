---
type: "query"
date: "2026-09-28T03:50:15.927389+00:00"
question: "How does successResponse mirror request as backend choke point across DB Utilities, Orders Cancellation Flow and Bank Account API?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["successResponse()", "errorResponse()", "pool", "upsertMiCuentaBancaria()", "cancelarPedidoComprador()"]
---

# Q: How does successResponse mirror request as backend choke point across DB Utilities, Orders Cancellation Flow and Bank Account API?

## Answer

Expanded via vocab: [success, response, error, pool, bank, cuenta, bancaria, cancelar, pedidos, tienda, carrito]. successResponse() backend/src/server/utils/response.js L5 degree 65 community 0; errorResponse() L21 degree 47 same file. Every controller imports both. Paths: successResponse<-upsertMiCuentaBancaria (1 hop, Bank Account API com 7); successResponse<-confirmarPago (1 hop, Orders com 9); successResponse<-pedidos.controllers->pool (2 hops, DB pool db.js L10); successResponse<-busqueda-pool-compras-cancelarPedidoComprador (4 hops). Mirror of frontend request(): single uniform-contract choke point {success,data}.

## Outcome

- Signal: useful

## Source Nodes

- successResponse()
- errorResponse()
- pool
- upsertMiCuentaBancaria()
- cancelarPedidoComprador()