import Header from "../../components/globales/Header";
import AgregarProducto from "../../components/perfil/AgregarProducto";
import SeguidoresModal from "../../components/perfil/SeguidoresModal";
import GrillaMisProductos from "./GrillaMisProductos";
import PerfilCabecera from "./PerfilCabecera";
import PerfilPestanas from "./PerfilPestanas";
import { usePerfilVendedor } from "./usePerfilVendedor.js";

export default function PerfilVendedor() {
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
  } = usePerfilVendedor();

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

        <GrillaMisProductos
          productos={productos}
          brokenImages={brokenImages}
          onImagenRota={(id) =>
            setBrokenImages((prev) => ({ ...prev, [id]: true }))
          }
          isMisProductos={isMisProductos}
          onEditar={setProductoEnEdicion}
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
    </div>
  );
}
