import { BIO_MAX_LENGTH, PENCIL_PATH } from "./perfilConstantes.js";

/**
 * Biografia editable del vendedor con contador de caracteres y aviso de vista previa.
 */
export default function PerfilBio({
  nombrePerfil,
  bioText,
  isEditingBio,
  bioDraft,
  avisoBio,
  textareaRef,
  onEdit,
  onCancel,
  onSave,
  onChangeDraft,
}) {
  return (
    <div className="max-w-[500px]">
      <div className="flex items-center gap-2.5 mb-2">
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: "18px",
            lineHeight: "28px",
            color: "var(--color-on-surface)",
          }}
        >
          {nombrePerfil}
        </p>
        {!isEditingBio && (
          <button
            onClick={onEdit}
            title="Editar descripción"
            className="flex-shrink-0 transition-all duration-150 hover:scale-110 p-1 rounded-full"
            style={{
              color: "var(--color-brand-muted-text)",
            }}
          >
            <svg
              className="w-[15px] h-[15px]"
              fill="currentColor"
              viewBox="0 0 15 15"
            >
              <path d={PENCIL_PATH} />
            </svg>
          </button>
        )}
      </div>

      {!isEditingBio ? (
        <p
          className="leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            fontSize: "15px",
            lineHeight: "26px",
            color: "var(--color-brand-muted-text)",
          }}
        >
          {bioText}
        </p>
      ) : (
        <div>
          <textarea
            ref={textareaRef}
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            value={bioDraft}
            onChange={(e) => onChangeDraft(e.target.value)}
            className="w-full rounded-2xl p-4 resize-none focus:outline-none transition-all duration-200"
            style={{
              backgroundColor: "var(--color-surface-container-lowest)",
              border: "1.5px solid var(--color-surface-container-high)",
              color: "var(--color-on-surface)",
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              lineHeight: "26px",
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <span
              className="font-medium"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color:
                  bioDraft.length >= BIO_MAX_LENGTH
                    ? "var(--color-brand-orange)"
                    : "var(--color-brand-muted-text)",
              }}
            >
              {bioDraft.length}/{BIO_MAX_LENGTH}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={onCancel}
                className="rounded-full font-semibold text-[13px] transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{
                  padding: "8px 18px",
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-brand-muted-text)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="rounded-full font-semibold text-[13px] transition-all duration-150 hover:shadow-md active:scale-95"
                style={{
                  padding: "8px 18px",
                  fontFamily: "var(--font-sans)",
                  backgroundColor: "var(--color-brand-orange)",
                  color: "var(--color-auth-card-bg)",
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {avisoBio && (
        <p
          role="status"
          className="mt-2 text-xs"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-brand-muted-text)",
          }}
        >
          {avisoBio}
        </p>
      )}
    </div>
  );
}
