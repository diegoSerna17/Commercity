import TopBar from "../../components/tienda/TopBar";
import WelcomeBanner from "../../components/tienda/WelcomeBanner";
import StatsSection from "../../components/tienda/StatsSection";
import BankAccountForm from "../../components/tienda/BankAccountForm";

const USUARIO_SIMULADO = { nombre: "Juan", apellido: "Giraldo" };

export default function Tienda({ usuario = USUARIO_SIMULADO }) {
  const primerNombre = usuario?.nombre?.trim() || "Usuario";
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || "Usuario";

  return (
    <div className="bg-surface-container-lowest text-on-surface font-sans min-h-screen md:min-h-0 flex flex-col overflow-y-auto">
      <TopBar nombreCompleto={nombreCompleto} />

      <main className="flex-1 p-4 sm:p-6 md:p-padding-lg lg:p-padding-xl space-y-md md:space-y-padding-lg">
        <WelcomeBanner primerNombre={primerNombre} />
        <StatsSection totalVentas={20} dineroRecaudado="$380.000" />
        <BankAccountForm />
      </main>
    </div>
  );
}
