export function BadgeEstadoUsuario({ estado }) {
  // TW Activo: fondo verde semitransparente con texto success
  if (estado === "activo")
    return (
      <span className="inline-flex items-center bg-success/10 text-success text-[11px] font-bold px-2 py-0.5 rounded-md font-sans">
        Activo
      </span>
    );
  // TW Baneado: fondo rojo semitransparente con texto report-red-text
  return (
    <span className="inline-flex items-center bg-accent-red/10 text-report-red-text text-[11px] font-bold px-2 py-0.5 rounded-md font-sans">
      Baneado
    </span>
  );
}

export function BadgeEstadoReporte({ estado }) {
  // TW Resuelto: fondo verde semitransparente
  if (estado === "resuelto")
    return (
      <span className="inline-flex items-center bg-success/10 text-success text-[11px] font-bold px-2.5 py-1 rounded-md font-sans">
        Resuelto
      </span>
    );
  // TW Pendiente: fondo rojo semitransparente
  return (
    <span className="inline-flex items-center bg-accent-red/10 text-report-red-text text-[11px] font-bold px-2.5 py-1 rounded-md font-sans">
      Pendiente
    </span>
  );
}

export function BadgeTipo({ tipo }) {
  // TW Usuario: borde rojo oscuro con texto accent-red
  if (tipo === "usuario")
    return (
      <span className="inline-flex items-center border border-report-red-hover/50 text-accent-red text-[11px] font-bold px-2 py-0.5 rounded font-sans">
        Usuario
      </span>
    );
  // TW Producto: borde secundario con texto secundario
  return (
    <span className="inline-flex items-center border border-secondary-container text-secondary text-[11px] font-bold px-2 py-0.5 rounded font-sans">
      Producto
    </span>
  );
}

export function BadgeComision({ porcentaje = "10" }) {
  return (
    <span className="inline-flex items-center bg-brand-orange/20 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap font-sans">
      Comision %{porcentaje}
    </span>
  );
}
