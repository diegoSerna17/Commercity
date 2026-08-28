import { useState } from "react";
import { ChevronDown } from "lucide-react";

// ─── Validadores por campo del formulario bancario ───────────────────────────
const BANK_VALIDATORS = {
  titular: (value) => {
    const v = value.trim();
    if (!v) return "El nombre del titular es obligatorio.";
    if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (v.length > 60) return "El nombre no puede superar los 60 caracteres.";
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(v)) {
      return "El nombre solo puede contener letras y espacios.";
    }
    if (v.split(/\s+/).length < 2) return "Ingresa nombre y apellido.";
    return null;
  },
  banco: (value) => (!value ? "Selecciona un banco." : null),
  tipoCuenta: (value) => (!value ? "Selecciona el tipo de cuenta." : null),
  numeroCuenta: (value) => {
    const v = value.trim();
    if (!v) return "El número de cuenta es obligatorio.";
    if (!/^\d+$/.test(v)) return "El número de cuenta solo puede contener dígitos.";
    if (v.length < 6 || v.length > 20) return "El número de cuenta debe tener entre 6 y 20 dígitos.";
    return null;
  },
};

const BANK_OPTIONS = [
  { value: "bancolombia", label: "Bancolombia" },
  { value: "davivienda", label: "Davivienda" },
  { value: "bbva", label: "BBVA" },
  { value: "banco_bogota", label: "Banco de Bogotá" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "ahorros", label: "Cuenta de Ahorros" },
  { value: "corriente", label: "Cuenta Corriente" },
];

const inputBaseClasses =
  "bg-input-bg border border-border-subtle rounded-xl px-4 h-[44px] sm:h-[50px] font-sans text-on-surface text-sm sm:text-base " +
  "placeholder-brand-muted-text outline-none transition-all w-full focus:ring-1";

function fieldClasses(hasError) {
  return [
    inputBaseClasses,
    hasError
      ? "border-error focus:border-error focus:ring-error"
      : "focus:border-brand-orange focus:ring-brand-orange",
  ].join(" ");
}

// ─── Campo de texto genérico con mensaje de error ────────────────────────────
function TextField({ id, label, value, placeholder, error, onChange, onBlur, inputMode, maxLength }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans font-medium text-brand-muted-text text-sm">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={fieldClasses(Boolean(error))}
      />
      <p className={`font-sans text-sm text-error mt-0.5 ${error ? "" : "hidden"}`}>{error}</p>
    </div>
  );
}

// ─── Campo select genérico con mensaje de error ──────────────────────────────
function SelectField({ id, label, value, options, placeholder, error, onChange, onBlur }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans font-medium text-brand-muted-text text-sm">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`appearance-none cursor-pointer ${fieldClasses(Boolean(error))}`}
        >
          <option value="" className="bg-surface-container">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-container">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted-text" />
      </div>
      <p className={`font-sans text-sm text-error mt-0.5 ${error ? "" : "hidden"}`}>{error}</p>
    </div>
  );
}

// ─── Formulario de cuenta bancaria ────────────────────────────────────────────
export default function BankAccountForm() {
  const [values, setValues] = useState({
    titular: "",
    banco: "",
    tipoCuenta: "",
    numeroCuenta: "",
  });
  const [errors, setErrors] = useState({});
  const [formMsg, setFormMsg] = useState(null);

  function validateField(name, value) {
    const message = BANK_VALIDATORS[name](value);
    setErrors((prev) => ({ ...prev, [name]: message }));
    return !message;
  }

  function handleChange(name) {
    return (e) => {
      let value = e.target.value;
      if (name === "numeroCuenta") value = value.replace(/\D/g, "");
      setValues((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) validateField(name, value);
    };
  }

  function handleBlur(name) {
    return (e) => validateField(name, e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const fieldNames = Object.keys(BANK_VALIDATORS);
    const results = fieldNames.map((name) => validateField(name, values[name]));
    const allValid = results.every(Boolean);

    if (!allValid) {
      setFormMsg({ text: "⚠️ Revisa los campos marcados en rojo.", type: "warning" });
      return;
    }

    setFormMsg({ text: "✅ Cuenta bancaria guardada correctamente.", type: "success" });
    setTimeout(() => setFormMsg(null), 4000);
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="font-sans font-bold text-on-surface text-lg sm:text-xl leading-[27px]">
          Registro de cuenta bancaria
        </h2>
        <p className="font-sans text-brand-muted-text text-xs sm:text-sm leading-[21px]">
          Registra tu cuenta bancaria para recibir los pagos de tus ventas
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-auth-card-bg border border-border-subtle rounded-card-lg overflow-hidden shadow-lg"
      >
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <TextField
            id="titular"
            label="Nombre del titular"
            placeholder="Ej: Daniel Stivens Palacios"
            value={values.titular}
            error={errors.titular}
            onChange={handleChange("titular")}
            onBlur={handleBlur("titular")}
          />

          <SelectField
            id="banco"
            label="Banco"
            placeholder="Selecciona un banco"
            options={BANK_OPTIONS}
            value={values.banco}
            error={errors.banco}
            onChange={handleChange("banco")}
            onBlur={handleBlur("banco")}
          />

          <SelectField
            id="tipoCuenta"
            label="Tipo de cuenta"
            placeholder="Selecciona tipo"
            options={ACCOUNT_TYPE_OPTIONS}
            value={values.tipoCuenta}
            error={errors.tipoCuenta}
            onChange={handleChange("tipoCuenta")}
            onBlur={handleBlur("tipoCuenta")}
          />

          <TextField
            id="numeroCuenta"
            label="Número de cuenta"
            placeholder="Ej: 1234567890"
            inputMode="numeric"
            maxLength={20}
            value={values.numeroCuenta}
            error={errors.numeroCuenta}
            onChange={handleChange("numeroCuenta")}
            onBlur={handleBlur("numeroCuenta")}
          />
        </div>

        <div className="border-t border-border-subtle px-4 sm:px-6 py-3 sm:py-4 bg-surface-container-low/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p
            className={`font-sans text-sm sm:text-base font-medium ${
              formMsg ? (formMsg.type === "success" ? "text-success" : "text-primary") : "hidden"
            }`}
          >
            {formMsg?.text}
          </p>
          <div className="sm:ml-auto w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-b from-primary-container to-primary-fixed-dim text-on-primary font-sans font-bold text-sm sm:text-base px-6 h-11 sm:h-12 rounded-button hover:opacity-95 active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-button-hover"
            >
              Guardar cuenta bancaria
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}