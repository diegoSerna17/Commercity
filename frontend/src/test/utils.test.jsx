import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import {
  crearArchivoImagen,
  mockFileReader,
  notificacionFalsa,
  pedidoFalso,
  productoFalso,
  renderConRutas,
  reporteFalso,
  usuarioFalso,
} from "./utils.jsx";

function VistaRuta() {
  const location = useLocation();
  return <p>ruta: {location.pathname}</p>;
}

describe("utilidades de prueba", () => {
  it("renderConRutas monta el componente en la ruta inicial", () => {
    renderConRutas(<VistaRuta />, { ruta: "/perfil" });

    expect(screen.getByText("ruta: /perfil")).toBeInTheDocument();
  });

  it("renderConRutas arma la tabla de rutas cuando recibe rutas", () => {
    renderConRutas(null, {
      ruta: "/historial",
      rutas: [
        { path: "/historial", element: <p>historial visible</p> },
        { path: "*", element: <p>otra ruta</p> },
      ],
    });

    expect(screen.getByText("historial visible")).toBeInTheDocument();
  });

  it("usuarioFalso toma el rol indicado y permite sobreescribir campos", () => {
    const usuario = usuarioFalso("admin", { id: 99 });

    expect(usuario.roles).toEqual(["admin"]);
    expect(usuario.id).toBe(99);
    expect(usuario.nombre_completo).toBeTruthy();
  });

  it("las fabricas devuelven datos ficticios con los campos que consumen las pantallas", () => {
    const producto = productoFalso({ stock: 0 });
    const pedido = pedidoFalso({ estado: "Entregado" });
    const reporte = reporteFalso({ tipo: "producto" });
    const notificacion = notificacionFalsa({ leida: true });

    expect(producto.stock).toBe(0);
    expect(producto.name).toBeTruthy();
    expect(producto.vendedorId).toBeTruthy();
    expect(pedido.estado).toBe("Entregado");
    expect(pedido.productos[0].precioUnit).toBeGreaterThan(0);
    expect(reporte.tipo).toBe("producto");
    expect(notificacion.leida).toBe(true);
    expect(notificacion.fecha_hora).toBeTruthy();
  });

  it("crearArchivoImagen construye un File con tipo de imagen", () => {
    const archivo = crearArchivoImagen();

    expect(archivo).toBeInstanceOf(File);
    expect(archivo.type).toBe("image/png");
  });

  it("mockFileReader entrega el resultado y se puede restaurar", () => {
    const original = globalThis.FileReader;
    const restaurar = mockFileReader("data:image/png;base64,QUJD");
    const lector = new globalThis.FileReader();
    const alCargar = vi.fn();

    lector.onload = alCargar;
    lector.readAsDataURL(crearArchivoImagen());

    expect(alCargar).toHaveBeenCalledTimes(1);
    expect(lector.result).toBe("data:image/png;base64,QUJD");

    restaurar();
    expect(globalThis.FileReader).toBe(original);
  });
});
