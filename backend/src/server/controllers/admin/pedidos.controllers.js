// La regla de destino de pedidos al banear/eliminar un vendedor vive en
// services/pedidos.service.js (compartida con la baja del comprador). Se
// re-exporta por la ruta historica para no romper importadores ni pruebas.
export { destinoPedidosVendedor } from "../../services/pedidos.service.js";
