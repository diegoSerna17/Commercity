import { Component } from "react";

/**
 * Limite de error de la SPA. Envuelve el Suspense raiz para que un fallo de
 * render o de carga de un chunk no deje la pantalla en blanco: muestra un
 * mensaje y un boton "Reintentar" que vuelve a montar el arbol.
 *
 * Debe ser un componente de clase: React solo ofrece `getDerivedStateFromError`
 * y `componentDidCatch` en clases.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reintentar = this.reintentar.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Sin datos sensibles: solo el mensaje y la pila de componentes.
    console.error("ErrorBoundary:", error?.message, info?.componentStack);
  }

  reintentar() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-md p-2xl text-center"
        >
          <h1 className="text-headline-md font-semibold text-on-surface">
            Algo salió mal
          </h1>
          <p className="max-w-md text-body-sm text-brand-muted-text">
            La página no pudo cargarse. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={this.reintentar}
            className="rounded-[10px] bg-brand-orange px-lg py-sm text-label-md font-bold text-brand-dark-text transition-all hover:brightness-110"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
