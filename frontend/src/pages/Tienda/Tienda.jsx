import { useCallback, useEffect, useState } from "react";
import TopBar from "../../components/tienda/TopBar";
import WelcomeBanner from "../../components/tienda/WelcomeBanner";
import StatsSection from "../../components/tienda/StatsSection";
import BankAccountForm from "../../components/tienda/BankAccountForm";
import { getCurrentUser } from "../../api/client.js";
import {
  listarIngresos,
  obtenerEstadisticasTienda,
  validarMiTienda,
} from "../../services/tienda.service.js";

function DatoValidacion({ titulo, ok, detalle }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1 w-3 h-3 rounded-full shrink-0 ${ok ? "bg-success" : "bg-error"}`}
      />
      <div className="min-w-0">
        <p className="font-sans font-semibold text-on-surface text-sm">{titulo}</p>
        <p className="font-sans text-brand-muted-text text-xs mt-0.5">{detalle}</p>
      </div>
    </li>
  );
}

export default function Tienda() {
  // JS El vendedor sale de la sesion real; los endpoints de tienda exigen JWT.
  const usuario = getCurrentUser();
  const nombreCompleto = usuario?.nombre_completo || "Usuario";
  const primerNombre = nombreCompleto.trim().split(" ")[0] || "Usuario";
  const esVendedor = (usuario?.roles ?? []).includes("vendedor");

  const [tarjetas, setTarjetas] = useState(null);
  const [ingresos, setIngresos] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  /** Carga estadisticas, ingresos y validacion de la tienda (RF121/RF130-RF139). */
  const cargarTienda = useCallback(async () => {
    setCargando(true);
    try {
      const [stats, ingresosRes, validacionRes] = await Promise.all([
        obtenerEstadisticasTienda(),
        listarIngresos({ porPagina: 5 }),
        validarMiTienda(),
      ]);

      setTarjetas(stats.data?.tarjetas ?? null);
      setIngresos(
        ingresosRes.data
          ? {
              resumen: ingresosRes.data.resumen ?? null,
              items: ingresosRes.data.items ?? [],
            }
          : null
      );
      setValidacion(validacionRes.data ?? null);
      setError("");
    } catch (err) {
      setError(err.message || "No se pudieron cargar los datos de tu tienda");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (esVendedor) cargarTienda();
    else setCargando(false);
  }, [esVendedor, cargarTienda]);

  const cuenta = validacion?.cuenta_bancaria ?? null;
  const flujo = validacion?.flujo_90_10 ?? null;

  return (
    <div className="bg-surface-container-lowest text-on-surface font-sans min-h-screen md:min-h-0 flex flex-col overflow-y-auto">
      <TopBar nombreCompleto={nombreCompleto} />

      <main className="flex-1 p-4 sm:p-6 md:p-padding-lg lg:p-padding-xl space-y-md md:space-y-padding-lg">
        <WelcomeBanner primerNombre={primerNombre} />

        {error && (
          <p className="font-sans text-report-red-text font-medium text-sm">{error}</p>
        )}

        {!esVendedor ? (
          <p className="font-sans text-brand-muted-text text-sm">
            Esta sección es para vendedores. Activa el rol de vendedor desde tu perfil
            para publicar productos y recibir pagos.
          </p>
        ) : cargando ? (
          <p className="font-sans text-brand-muted-text text-sm">Cargando tu tienda...</p>
        ) : (
          <>
            <StatsSection tarjetas={tarjetas} ingresos={ingresos} />

            {validacion && (
              <section className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="font-sans font-bold text-on-surface text-lg sm:text-xl">
                    Validación de Mi Tienda
                  </h2>
                  <p className="font-sans text-brand-muted-text text-xs sm:text-sm">
                    Estado de tu cuenta bancaria y del reparto 90/10
                  </p>
                </div>

                <ul className="bg-auth-card-bg border border-border-subtle rounded-card p-4 sm:p-5 space-y-4 shadow-lg">
                  <DatoValidacion
                    titulo={cuenta?.completa ? "Cuenta bancaria completa" : "Cuenta bancaria pendiente"}
                    ok={Boolean(cuenta?.completa)}
                    detalle={
                      cuenta?.completa
                        ? `${cuenta.banco} · ${cuenta.tipo_cuenta} · ${cuenta.numero_enmascarado ?? ""}`
                        : "Registra titular, banco, tipo y número de cuenta (RF131-RF133)"
                    }
                  />
                  <DatoValidacion
                    titulo={flujo?.validado ? "Reparto 90/10 consistente" : "Revisar reparto 90/10"}
                    ok={Boolean(flujo?.validado)}
                    detalle={
                      flujo
                        ? `${flujo.lineas_analizadas} líneas analizadas · ${flujo.lineas_incoherentes} incoherentes · neto esperado ${"$" + Math.round(flujo.totales?.vendedor_90_esperado ?? 0).toLocaleString("es-CO")}`
                        : "Sin líneas de venta para validar"
                    }
                  />
                </ul>
              </section>
            )}

            <BankAccountForm onGuardado={cargarTienda} />
          </>
        )}
      </main>
    </div>
  );
}
