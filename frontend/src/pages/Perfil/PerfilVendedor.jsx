import { useState } from "react";
import Header from "../../components/globales/Header";
import AgregarProducto from "../../components/perfil/AgregarProducto";
import SeguidoresModal from "../../components/perfil/SeguidoresModal";
import Modal from "../../components/globales/Modal";
import GrillaMisProductos from "./GrillaMisProductos";
import PerfilCabecera from "./PerfilCabecera";
import PerfilPestanas from "./PerfilPestanas";
import PerfilCalificaciones from "./PerfilCalificaciones.jsx";
import { getCurrentUser } from "../../api/client.js";
import { usePerfilVendedor } from "./usePerfilVendedor.js";

export default function PerfilVendedor() {
  const usuarioActual = getCurrentUser();
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminandoProducto, setEliminandoProducto] = useState(false);
  const {
    nombrePerfil,
    productos,
    seguidores,
    siguiendo,
    setActiveTab,
    isMisProductos,
    bioText,
    isEditingBio,
    bioDraft,
    setBioDraft,
    editBio,
    cancelEditBio,
    saveBio,
    avisoBio,
    avatarSrc,
    avatarError,
    setAvatarError,
    avisoAvatar,
    handleAvatarChange,
    avatarInputRef,
    textareaRef,
    brokenImages,
    setBrokenImages,
    mostrarAgregarProducto,
    setMostrarAgregarProducto,
    productoEnEdicion,
    setProductoEnEdicion,
    mostrarSeguidores,
    setMostrarSeguidores,
    tabInicialSeguidores,
    abrirSeguidores,
    recargarSeguidores,
    handleAgregarProducto,
    handleActualizarProducto,
    handleCambiarEstadoProducto,
    handleEliminarProducto,
  } = usePerfilVendedor();

  /** RF55: la baja se confirma en un modal accesible, no en window.confirm. */
  async function confirmarEliminarProducto() {
    if (!productoAEliminar) return;
    setEliminandoProducto(true);
    try {
      await handleEliminarProducto(productoAEliminar.id);
      setProductoAEliminar(null);
    } catch {
      // Si la baja falla, la publicacion sigue visible en la grilla.
    } finally {
      setEliminandoProducto(false);
    }
  }

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-y-auto"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <Header title="Perfil" showSearch={false} />

      <main
        className="flex-1 px-4 sm:px-6 lg:px-10 py-6 md:py-10 mx-auto w-full overflow-y-auto"
        style={{ maxWidth: "1200px" }}
      >
        <PerfilCabecera
          nombrePerfil={nombrePerfil}
          avatarSrc={avatarSrc}
          avatarError={avatarError}
          avisoAvatar={avisoAvatar}
          onAvatarError={() => setAvatarError(true)}
          avatarInputRef={avatarInputRef}
          onAvatarChange={handleAvatarChange}
          isMisProductos={isMisProductos}
          seguidores={seguidores}
          siguiendo={siguiendo}
          productos={productos}
          onAbrirSeguidores={abrirSeguidores}
          onAgregarProducto={() => setMostrarAgregarProducto(true)}
          bioText={bioText}
          isEditingBio={isEditingBio}
          bioDraft={bioDraft}
          avisoBio={avisoBio}
          textareaRef={textareaRef}
          onEditBio={editBio}
          onCancelBio={cancelEditBio}
          onSaveBio={saveBio}
          onChangeBioDraft={setBioDraft}
        />

        <PerfilPestanas isMisProductos={isMisProductos} onCambiarTab={setActiveTab} />

        <PerfilCalificaciones vendedorId={usuarioActual?.id} />

        <GrillaMisProductos
          productos={productos}
          brokenImages={brokenImages}
          onImagenRota={(id) =>
            setBrokenImages((prev) => ({ ...prev, [id]: true }))
          }
          isMisProductos={isMisProductos}
          onEditar={setProductoEnEdicion}
          onCambiarEstado={handleCambiarEstadoProducto}
          onEliminar={(id) =>
            setProductoAEliminar(
              productos.find((producto) => String(producto.id) === String(id)) ??
                { id }
            )
          }
        />
      </main>

      {mostrarAgregarProducto && (
        <AgregarProducto
          onCancel={() => setMostrarAgregarProducto(false)}
          onSubmit={handleAgregarProducto}
        />
      )}

      {productoEnEdicion && (
        <AgregarProducto
          producto={productoEnEdicion}
          onCancel={() => setProductoEnEdicion(null)}
          onSubmit={handleActualizarProducto}
        />
      )}

      {mostrarSeguidores && (
        <SeguidoresModal
          key={tabInicialSeguidores}
          datos={{ usuario: nombrePerfil, seguidores, siguiendo }}
          initialTab={tabInicialSeguidores}
          onClose={() => setMostrarSeguidores(false)}
          onChanged={recargarSeguidores}
        />
      )}

      <Modal
        abierto={Boolean(productoAEliminar)}
        onClose={() => setProductoAEliminar(null)}
        tituloId="perfil-eliminar-producto-titulo"
        panelClassName="max-w-lg rounded-hero border border-figma-divider bg-auth-card-bg p-6 sm:p-10 shadow-2xl"
      >
        <h4
          id="perfil-eliminar-producto-titulo"
          className="text-headline-sm font-bold text-on-surface mb-4"
        >
          ¿Eliminar la publicacion?
        </h4>
        <p className="text-brand-muted-text text-body-sm leading-6 mb-8">
          Se dara de baja &quot;{productoAEliminar?.name}&quot;. Los pedidos y las
          calificaciones existentes se conservan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setProductoAEliminar(null)}
            className="flex-1 rounded-card border border-figma-divider bg-transparent px-4 py-3 text-body-sm font-bold text-brand-muted-text transition hover:bg-input-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarEliminarProducto}
            disabled={eliminandoProducto}
            className="flex-1 rounded-card bg-brand-orange px-4 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 disabled:opacity-60"
          >
            {eliminandoProducto ? "Eliminando..." : "Si, dar de baja"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
