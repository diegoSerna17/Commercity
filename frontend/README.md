# CommerCity — Frontend (React + Vite)

SPA en **React 19** + **Vite 8** + **Tailwind CSS 4**. Consume la API REST del backend (Express, puerto 3000) con JWT Bearer.

## Obtener el código (rama PREVIEW)

```bash
git clone -b PREVIEW https://github.com/diegoSerna17/Commercity.git
cd Commercity/frontend
npm ci            # instala según package-lock.json (o npm install)
```

Requiere **Node.js 22.22.2+** (hay `.nvmrc` con la versión recomendada).

## Ejecución

```bash
npm run dev      # servidor de desarrollo -> http://localhost:5173
npm run build    # build de producción (carpeta dist/)
npm run preview  # sirve el build de producción
npm run lint     # ESLint
```

> \[!IMPORTANT]
> El backend debe estar corriendo en `http://localhost:3000` antes de usar la app. Sigue la configuración general en el `README.md` de la raíz.

## URL de la API

La URL del backend se toma de `VITE_API_URL` (archivo `.env` en la raíz de `frontend/`):

```bash
VITE_API_URL=http://localhost:3000
```

Si no defines `.env`, el valor por defecto es `http://localhost:3000` (ver [src/constants/config.js](src/constants/config.js)).

## Pruebas

```bash
npm test              # suite completa (Vitest + jsdom + Testing Library)
npm run test:watch    # modo observador
npm run test:coverage # cobertura
```

> \[!IMPORTANT]
> Las pruebas se ejecutan **siempre desde `frontend/`**. Lanzadas desde la raíz del repositorio fallan.
