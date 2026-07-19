import { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";

function useToast() {
  const [toast, setToast] = useState({ visible: false, msg: "", isError: false });
  const timerRef = useRef(null);

  function showToast(msg, isError = false) {
    clearTimeout(timerRef.current);
    setToast({ visible: true, msg, isError });
    timerRef.current = setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 3500);
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}

function Toast({ toast }) {
  if (!toast.visible) return null;

  return (
    <div
      className={`mb-4 rounded-card border px-4 py-3 text-body-sm ${
        toast.isError
          ? "border-error-container bg-error-container/20 text-error"
          : "border-success bg-success/15 text-green-200"
      }`}
    >
      {toast.msg}
    </div>
  );
}

const sectionDivider = "border-t-2 border-auth-card-bg mb-padding-lg";
const cardClass =
  "bg-auth-card-bg rounded-card-lg p-padding-lg sm:p-padding-xl mb-padding-xl shadow-lg";
const labelClass =
  "block mb-2 text-body-sm font-bold text-brand-muted-text";
const inputClass =
  "input-field bg-input-bg border-input-bg text-on-surface placeholder:text-brand-muted-text focus:ring-border-focus";

export default function Ajustes() {
  const [usuario, setUsuario] = useState("Juan_Giraldo");
  const [email, setEmail] = useState("Juan_commercity@gmail.com");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [depto, setDepto] = useState("");
  const [modalEliminar, setModalEliminar] = useState(false);

  const { toast: toastPersonal, showToast: showToastPersonal } = useToast();
  const { toast: toastDir, showToast: showToastDir } = useToast();

  useEffect(() => {
    document.body.style.overflow = modalEliminar ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalEliminar]);

  function handlePersonal(event) {
    event.preventDefault();

    if (!usuario.trim()) {
      showToastPersonal("El campo Usuario no puede estar vacio.", true);
      return;
    }

    if (!email || !email.includes("@")) {
      showToastPersonal("Ingresa un correo electronico valido.", true);
      return;
    }

    showToastPersonal("Cambios guardados correctamente.");
  }

  function handleDireccion(event) {
    event.preventDefault();

    if (!direccion.trim() || !ciudad.trim() || !depto.trim()) {
      showToastDir("Por favor completa todos los campos de direccion.", true);
      return;
    }

    showToastDir("Direccion actualizada correctamente.");
  }

  function handleVendedor() {
    showToastPersonal("Felicidades, ya podras vender en CommerCity.");
  }

  function confirmarEliminar() {
    setModalEliminar(false);
    showToastPersonal("Cuenta eliminada. Hasta pronto.", true);
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Ajustes" />

        <section className="flex-1 overflow-y-auto px-padding-lg sm:px-padding-xl py-padding-xl">
          <div className="max-w-4xl w-full mx-auto">
            <div className="mb-padding-lg">
              <h1 className="text-headline-md sm:text-[30px] font-extrabold tracking-tight text-on-surface">
                Ajustes
              </h1>
              <p className="text-brand-muted-text text-body-sm font-medium mt-1">
                Administra tu informacion personal y preferencias sobre la cuenta.
              </p>
            </div>

            <div className={sectionDivider} />

            <div className="mb-padding-lg">
              <h2 className="text-headline-sm font-bold text-on-surface">
                Informacion personal
              </h2>
              <p className="text-brand-muted-text text-body-sm font-medium mt-1">
                Actualiza tu usuario y correo electronico.
              </p>
            </div>

            <Toast toast={toastPersonal} />

            <div className={cardClass}>
              <form onSubmit={handlePersonal} noValidate>
                <div className="mb-5">
                  <label className={labelClass} htmlFor="input-usuario">
                    Usuario
                  </label>
                  <input
                    id="input-usuario"
                    type="text"
                    value={usuario}
                    onChange={(event) => setUsuario(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="mb-6">
                  <label className={labelClass} htmlFor="input-email">
                    Correo electronico
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99]"
                >
                  Guardar Cambios
                </button>
              </form>
            </div>

            <div className={sectionDivider} />

            <div className="mb-padding-lg">
              <h2 className="text-headline-sm font-bold text-on-surface">
                Direccion de entrega
              </h2>
              <p className="text-brand-muted-text text-body-sm font-medium mt-1">
                Agrega tu direccion para recibir tus pedidos.
              </p>
            </div>

            <Toast toast={toastDir} />

            <div className={cardClass}>
              <form onSubmit={handleDireccion} noValidate>
                <div className="mb-5">
                  <label className={labelClass} htmlFor="input-direccion">
                    Direccion
                  </label>
                  <input
                    id="input-direccion"
                    type="text"
                    placeholder="Ej: Calle 123 # 45 - 07"
                    value={direccion}
                    onChange={(event) => setDireccion(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className={labelClass} htmlFor="input-ciudad">
                      Ciudad
                    </label>
                    <input
                      id="input-ciudad"
                      type="text"
                      placeholder="Ej: Cali"
                      value={ciudad}
                      onChange={(event) => setCiudad(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="input-depto">
                      Departamento
                    </label>
                    <input
                      id="input-depto"
                      type="text"
                      placeholder="Ej: Valle del cauca"
                      value={depto}
                      onChange={(event) => setDepto(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99]"
                >
                  Cambiar Direccion
                </button>
              </form>
            </div>

            <div className={sectionDivider} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-card border border-brand-orange bg-brand-orange/5 p-padding-lg mb-padding-xl shadow-lg">
              <div className="flex-1">
                <h3 className="text-headline-sm font-bold text-on-surface mb-2">
                  ¿Quieres vender en CommerCity?
                </h3>
                <p className="text-brand-muted-text text-body-sm font-medium leading-6">
                  Crea tu tienda y construye tu futuro en CommerCity, llega a mas compradores en esta comunidad.
                </p>
              </div>
              <button
                id="btn-vendedor"
                onClick={handleVendedor}
                className="shrink-0 rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99]"
              >
                Cambiar a vendedor
              </button>
            </div>

            <div className="border-t-2 border-report-red-bg mb-padding-lg" />

            <div className={`${cardClass} mb-padding-2xl`}>
              <h3 className="text-headline-sm font-bold text-report-red-text mb-3">
                Elimina tu cuenta
              </h3>
              <p className="text-brand-muted-text text-body-sm font-medium leading-6 mb-6">
                Una vez que elimines tu cuenta, todos tus datos seran borrados permanentemente. Esta accion no se puede deshacer.
              </p>
              <button
                onClick={() => setModalEliminar(true)}
                className="rounded-card border border-report-red-text bg-report-red-bg px-6 py-3 text-body-sm font-bold text-report-red-text transition hover:bg-report-red-text hover:text-white"
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- BACKDROP Y CONTENEDOR DEL MODAL MODIFICADO --- */}
      <div className={`fixed inset-0 items-center justify-center bg-black/70 px-6 sm:px-10 z-[999999] ${modalEliminar ? "flex" : "hidden"}`} onClick={(event) => { if (event.target === event.currentTarget) setModalEliminar(false); }}>
        {/* Se cambió de max-w-2xl a max-w-4xl, y los paddings de p-8 sm:p-10 a p-10 sm:p-14 */}
        <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl rounded-hero border border-report-red-bg bg-auth-card-bg p-6 sm:p-10 md:p-14 shadow-2xl overflow-y-auto max-h-[90vh]">
          <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-report-red-bg text-report-red-text">
              <span className="text-3xl sm:text-4xl font-bold">!</span>
            </div>
            <div className="flex-1">
              <h4 className="text-headline-sm sm:text-headline-md md:text-headline-lg font-bold text-report-red-text mb-2 sm:mb-4">
                ¿Eliminar cuenta?
              </h4>
              <p className="text-brand-muted-text text-body-sm sm:text-body-md md:text-body-lg leading-6">
                Esta accion es permanente e irreversible. Todos tus datos, compras, mensajes y configuraciones seran borrados de forma definitiva. No podras recuperar tu cuenta.
              </p>
            </div>
          </div>

          {/* Submodal o Alerta interna expandida con más padding (px-8 py-6) */}
          <div className="rounded-card border border-report-red-bg bg-report-red-bg/30 px-4 py-4 sm:px-8 sm:py-6 mb-6 sm:mb-10">
            <p className="text-body-sm sm:text-body-md font-medium text-report-red-text">
              ⚠️ Antes de continuar, confirma que entiendes que no podremos recuperar tu cuenta despues de eliminarla. Esta accion es definitiva.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
            <button
              onClick={() => setModalEliminar(false)}
              className="flex-1 rounded-card border border-figma-divider bg-transparent px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-brand-muted-text transition hover:bg-input-bg"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarEliminar}
              className="flex-1 rounded-card bg-report-red-text px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-white transition hover:opacity-90"
            >
              Si, eliminar cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}