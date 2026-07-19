export function calculateTotals(carrito) {
  let subtotal = 0;
  let descuento = 0;

  carrito.forEach((producto) => {
    subtotal += producto.precio * producto.cantidad;

    if (producto.precioOriginal) {
      descuento +=
        (producto.precioOriginal - producto.precio) *
        producto.cantidad;
    }
  });

  return {
    subtotal,
    descuento,
    total: subtotal,
  };
}