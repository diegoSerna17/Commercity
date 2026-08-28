export default function WelcomeBanner({ primerNombre }) {
  return (
    <div className="bg-auth-card-bg border border-border-subtle rounded-card-lg px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
      <h1 className="font-sans font-bold text-on-surface text-xl sm:text-2xl leading-tight sm:leading-[30px]">
        Bienvenido de nuevo, {primerNombre} 👋
      </h1>
      <p className="font-sans text-brand-muted-text text-sm sm:text-base mt-1 leading-relaxed sm:leading-[21px]">
        Revisa cómo va tu tienda, visualiza estadísticas sobre tu tienda y gestiona tu cuenta bancaria.
      </p>
    </div>
  );
}