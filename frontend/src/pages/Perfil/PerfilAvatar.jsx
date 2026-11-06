/**
 * Avatar editable del perfil con su boton de cambio y el aviso de vista previa.
 */
export default function PerfilAvatar({
  nombrePerfil,
  avatarSrc,
  avatarError,
  avisoAvatar,
  onAvatarError,
  avatarInputRef,
  onAvatarChange,
}) {
  return (
    <div className="relative flex-shrink-0 mx-auto md:mx-0">
      <div
        className="rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
        style={{
          width: "176px",
          height: "176px",
          backgroundColor: "var(--color-surface-container-high)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {!avatarError ? (
          <img
            id="avatar-img"
            src={avatarSrc}
            alt={`Avatar de ${nombrePerfil}`}
            className="w-full h-full object-cover"
            onError={onAvatarError}
          />
        ) : (
          <svg
            className="w-1/2 h-1/2"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.45c-3.27 0-9.8 1.64-9.8 4.9V21h19.6v-1.65c0-3.26-6.53-4.9-9.8-4.9Z" />
          </svg>
        )}
      </div>

      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
      />
      <button
        onClick={() => avatarInputRef.current?.click()}
        title="Cambiar foto de perfil"
        className="absolute bottom-3 right-3 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "var(--color-auth-card-bg)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 18"
          style={{ color: "var(--color-on-surface)" }}
        >
          <path d="M10 14.5C11.25 14.5 12.3125 14.0625 13.1875 13.1875C14.0625 12.3125 14.5 11.25 14.5 10C14.5 8.75 14.0625 7.6875 13.1875 6.8125C12.3125 5.9375 11.25 5.5 10 5.5C8.75 5.5 7.6875 5.9375 6.8125 6.8125C5.9375 7.6875 5.5 8.75 5.5 10C5.5 11.25 5.9375 12.3125 6.8125 13.1875C7.6875 14.0625 8.75 14.5 10 14.5ZM10 12.5C9.3 12.5 8.70833 12.2583 8.225 11.775C7.74167 11.2917 7.5 10.7 7.5 10C7.5 9.3 7.74167 8.70833 8.225 8.225C8.70833 7.74167 9.3 7.5 10 7.5C10.7 7.5 11.2917 7.74167 11.775 8.225C12.2583 8.70833 12.5 9.3 12.5 10C12.5 10.7 12.2583 11.2917 11.775 11.775C11.2917 12.2583 10.7 12.5 10 12.5ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H5.15L7 0H13L14.85 2H18C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V16C20 16.55 19.8042 17.0208 19.4125 17.4125C19.0208 17.8042 18.55 18 18 18H2ZM2 16H18V4H13.95L12.125 2H7.875L6.05 4H2V16Z" />
        </svg>
      </button>
      {avisoAvatar && (
        <p
          role="status"
          className="mt-3 text-center text-xs"
          style={{
            maxWidth: "176px",
            fontFamily: "var(--font-sans)",
            color: "var(--color-brand-muted-text)",
          }}
        >
          {avisoAvatar}
        </p>
      )}
    </div>
  );
}
