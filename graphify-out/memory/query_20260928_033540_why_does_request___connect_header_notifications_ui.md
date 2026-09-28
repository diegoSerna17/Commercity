---
type: "query"
date: "2026-09-28T03:35:40.793264+00:00"
question: "Why does request() connect Header Notifications UI to Frontend API Client, Bank Account Form, Seller Product UI, Product Detail History, Cart Checkout UI?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["request()", "BankAccountForm()", "Carrito()", "FichaProducto()", "Header()", "HistorialDeCompras()"]
---

# Q: Why does request() connect Header Notifications UI to Frontend API Client, Bank Account Form, Seller Product UI, Product Detail History, Cart Checkout UI?

## Answer

Expanded from original query via vocab: [request, header, client, bank, seller, product, cart, api, form, account, historial, notificaciones]. Traversed BFS from request() (frontend/src/api/client.js L23, degree 77): all 13 frontend services import request; paths: request<-obtenerMiCuentaBancaria<-BankAccountForm (2 hops), request<-listarCarrito<-Carrito (2 hops), request<-contarNoLeidas<-Header (2 hops), request<-listarHistorialCompras<-HistorialDeCompras (2 hops), request<-historial.service-FichaProducto (3 hops).

## Outcome

- Signal: useful

## Source Nodes

- request()
- BankAccountForm()
- Carrito()
- FichaProducto()
- Header()
- HistorialDeCompras()