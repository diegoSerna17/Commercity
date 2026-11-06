import PerfilAvatar from "./PerfilAvatar";
import PerfilBio from "./PerfilBio";
import PerfilInfo from "./PerfilInfo";

/**
 * Tarjeta superior del perfil: avatar, datos, contadores y biografia.
 */
export default function PerfilCabecera({
  nombrePerfil,
  avatarSrc,
  avatarError,
  avisoAvatar,
  onAvatarError,
  avatarInputRef,
  onAvatarChange,
  isMisProductos,
  seguidores,
  siguiendo,
  productos,
  onAbrirSeguidores,
  onAgregarProducto,
  bioText,
  isEditingBio,
  bioDraft,
  avisoBio,
  textareaRef,
  onEditBio,
  onCancelBio,
  onSaveBio,
  onChangeBioDraft,
}) {
  return (
    <div
      className="rounded-3xl p-6 md:p-10 mb-8"
      style={{
        backgroundColor: "var(--color-auth-card-bg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
        <PerfilAvatar
          nombrePerfil={nombrePerfil}
          avatarSrc={avatarSrc}
          avatarError={avatarError}
          avisoAvatar={avisoAvatar}
          onAvatarError={onAvatarError}
          avatarInputRef={avatarInputRef}
          onAvatarChange={onAvatarChange}
        />

        <div className="flex-1 min-w-0 w-full">
          <PerfilInfo
            nombrePerfil={nombrePerfil}
            isMisProductos={isMisProductos}
            seguidores={seguidores}
            siguiendo={siguiendo}
            productos={productos}
            onAbrirSeguidores={onAbrirSeguidores}
            onAgregarProducto={onAgregarProducto}
          />

          <PerfilBio
            nombrePerfil={nombrePerfil}
            bioText={bioText}
            isEditingBio={isEditingBio}
            bioDraft={bioDraft}
            avisoBio={avisoBio}
            textareaRef={textareaRef}
            onEdit={onEditBio}
            onCancel={onCancelBio}
            onSave={onSaveBio}
            onChangeDraft={onChangeBioDraft}
          />
        </div>
      </div>
    </div>
  );
}
