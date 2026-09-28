# React + Vite

Este frontend es parte de CommerCity. El código se distribuye para pruebas del equipo en la rama **`PREVIEW`** del repo oficial:

```bash
git clone -b PREVIEW https://github.com/diegoSerna17/Commercity.git
cd Commercity/frontend
npm install
npm run dev      # http://localhost:5173
```

La URL de la API se configura con `VITE_API_URL` (`.env` en `frontend/`, por defecto `http://localhost:3000`). Configuración completa del proyecto en el `README.md` de la raíz.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
