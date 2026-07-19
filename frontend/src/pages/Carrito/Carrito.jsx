import { useState } from "react";

import Header from "../../components/Header";
import ItemCarrito from "../../components/Carrito/ItemCarrito";
import ResumenCarrito from "../../components/Carrito/ResumenCarrito";
import ModalPago from "../../components/Carrito/ModalPago";
import ModalExito from "../../components/Carrito/ModalExito";
import CarritoVacio from "../../components/Carrito/CarritoVacio";

import { productosIniciales } from "../../data/productos.js";

function Carrito() {
  const [carrito, setCarrito] = useState(productosIniciales);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const abrirPasarela = () => {
    if (carrito.length === 0) return;
    setShowPaymentModal(true);
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((p) => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter((p) => p.cantidad > 0)
    );
  };

  const eliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex h-dvh bg-surface-container-lowest overflow-hidden">

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header superior */}
        <Header showSearch={false} />

        {/* Área de scroll del carrito */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 md:py-8">
          <div className="max-w-4xl w-full mx-auto">

            {/* Título */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <span className="text-xl sm:text-2xl">🛒</span>
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-brand-orange">
                Carrito de Compras
              </h2>
            </div>

            {/* Lista de productos */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
              {carrito.length === 0 ? (
                <CarritoVacio />
              ) : (
                carrito.map((producto) => (
                  <ItemCarrito
                    key={producto.id}
                    producto={producto}
                    cambiarCantidad={cambiarCantidad}
                    eliminarProducto={eliminarProducto}
                  />
                ))
              )}
            </div>

            {/* Totales + Botón Comprar */}
            {carrito.length > 0 && (
              <ResumenCarrito carrito={carrito} onComprar={abrirPasarela} />
            )}

          </div>
        </div>
      </main>

      {/* Modal Pago */}
      {showPaymentModal && (
        <ModalPago
          carrito={carrito}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={() => {
            setShowPaymentModal(false);
            setShowSuccessModal(true);
          }}
        />
      )}

      {/* Modal Éxito */}
      {showSuccessModal && (
        <ModalExito
          onClose={() => {
            setShowSuccessModal(false);
            setCarrito([]);
          }}
        />
      )}
    </div>
  );
}

export default Carrito;