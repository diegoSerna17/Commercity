/**
 * Aviso inline de Ajustes (mismo estilo en todas las secciones).
 */
export default function AjustesToast({ toast }) {
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
