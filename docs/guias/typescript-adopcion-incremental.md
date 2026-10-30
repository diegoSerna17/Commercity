# Adopcion incremental de TypeScript en CommerCity

> **Estado**: decision documentada el 2026-10-24. **No implementada**: no se instalo
> TypeScript ni se creo `tsconfig.json`. Este documento existe para decidir con datos y
> para defender la decision ante el lider Backend/API, el Director y el instructor.
>
> Autor: Daniel Palacios (lider Backend/API). Rama `fix/pendientes-auditoria-2026-10-12`.

## 1. Decision

**No migrar el proyecto a TypeScript en este ciclo.** Adoptar, si el lider lo aprueba, una
ruta incremental de bajo riesgo que empieza por **verificacion de tipos sin cambiar el
runtime** (nivel 0) y que **no toca** el backend, el build, las pruebas ni el despliegue.

La migracion completa queda como decision post-entrega o sujeta a que exista un RF que la
respalde. Hoy no existe: TypeScript no aparece en el documento oficial del 2026-08-20.

## 2. Hechos verificados (2026-10-24)

| Hecho | Evidencia |
|---|---|
| No existe `tsconfig.json` ni `jsconfig.json` en el repositorio | busqueda en todo el arbol, sin resultados |
| `typescript` no esta instalado | `backend/package.json` y `frontend/package.json` |
| El frontend ya trae `@types/react` (^19.2.14) y `@types/react-dom` (^19.2.3) | `frontend/package.json`, hoy solo sirven al editor |
| ESLint lintea unicamente `**/*.{js,jsx}` | `frontend/eslint.config.js` |
| El backend arranca con `node src/server/server.js` en ESM puro | `backend/package.json`, `"type": "module"` |
| El frontend usa Vite 8 y Vitest 5 | `frontend/package.json`; ambos procesan `.ts` y `.tsx` de forma nativa |
| El frontend vive en `frontend/src/` con `api/`, `services/`, `utils/`, `pages/`, `components/` | estructura del arbol |
| Tamanos del sistema | 72 endpoints, 13 routers, 19 tablas (segun `docs/MEMORIA_PROYECTO.md`) |

## 3. Por que no migrar ahora

1. **No hay RF.** Sin respaldo en el documento del 2026-08-20 y sin aval, la regla de
   gobernanza dice documentar y agendar, no implementar.
2. **El proyecto esta en cierre**, sobre un contrato ya congelado entre los tres clientes
   (`{ success, data }` / `{ success, error }`). Una migracion de tipos sobre un contrato
   abierto a tres clientes amplifica cualquier cambio de firma.
3. **El backend no puede migrar sin costo operativo.** Con ESM y arranque directo por
   `node`, usar `.ts` exige un paso de build o el type-stripping de Node (experimental en la
   serie 22) y volver a validar las 536 pruebas. Es riesgo sin beneficio inmediato.
4. **El costo real no es el lenguaje, es el linter.** En cuanto exista un `.tsx`, ESCRIBIR
   codigo que el linter no mira es peor que no tener TypeScript: hace falta
   `typescript-eslint`, es decir, tocar un control de calidad compartido.

## 4. Ruta incremental por niveles

| Nivel | Alcance | Toca build, pruebas o despliegue | Riesgo | Requiere aval |
|---|---|---|---|---|
| 0 | `typescript` como devDependency + `tsconfig.json` con `allowJs` y `checkJs: false`; script `typecheck` separado | No | Nulo | Si (dependencia nueva) |
| 1 | Tipos por JSDoc del contrato de la API (`@typedef`, `@param`) y `checkJs` limitado a `src/api` y `src/utils` | No | Nulo | Si (dependencia nueva) |
| 2 | Archivos nuevos escritos en `.ts`/`.tsx`, sin tocar los existentes, mas `typescript-eslint` para que el linter los vea | Parcial: agrega plugin de ESLint | Bajo | Si |
| 3 | Migrar el backend a `.ts` | Si: build, 536 pruebas, arranque y despliegue | Alto | No recomendado en este ciclo |

El nivel 0 y el nivel 1 son los unicos que pueden hacerse **sin cambiar una sola linea de
codigo de producto**. Si el chequeo de tipos marca cientos de errores, no rompe nada: es un
comando aparte que todavia no es obligatorio en la integracion.

## 5. Configuracion concreta (para evaluar costo, no para aplicar aun)

Nivel 0, en `frontend/`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Script en `frontend/package.json`:

```json
"typecheck": "tsc --noEmit"
```

Nivel 1, chequeo restringido a los archivos que el equipo controla, en un segundo archivo
`tsconfig.checks.json` que extiende el anterior y activa `checkJs: true` con
`include: ["src/api/**/*.js", "src/utils/**/*.js"]`.

Nivel 2, la unica pieza que agrega costo real:

```js
// eslint.config.js
files: ['**/*.{js,jsx,ts,tsx}'],
// requiere: npm i -D typescript-eslint
```

## 6. Lo que no se debe hacer

- **Renombrar archivos existentes de `.jsx` a `.tsx` en lote.** Ahi si se rompe: el linter
  deja de verlos hasta configurar `typescript-eslint` y cualquier error de tipos aparece en
  un archivo que hoy funciona.
- **Activar `checkJs: true` sobre todo `src/` en el primer intento.** El numero de errores
  va a ser alto y se va a leer como "rompimos el proyecto" cuando en realidad son avisos.
- **Usar `strict: true` de entrada.** Convierte avisos en errores y bloquea la entrega.
- **Tocar el backend** en este ciclo.

## 7. Como se mide (linea base pendiente)

No existe linea base: en la sesion del 2026-10-24 no habia Node instalado, por lo que
`tsc` nunca se ejecuto. La primera medicion debe hacerla una persona con Node:

```powershell
cd frontend
npm run typecheck
```

El resultado (`Found N errors in M files`) se registra aqui como linea base. Cualquier
propuesta posterior se compara contra ese numero, nunca contra una estimacion.

## 8. Encuadre SENA

- TypeScript no es un RF: es **herramienta**, no funcionalidad del producto.
- Su valor formativo es real: tipado estatico es competencia del programa y el comando
  `npm run typecheck` corre en segundos, lo que sirve como **evidencia de avance semanal**
  sin inventar funcionalidades nuevas.
- Se documenta y se agenda (P2) hasta que el Director o el instructor lo pidan por escrito.

## 9. Cuando se revisa esta decision

- Si el Director o el instructor piden TypeScript como requisito de entrega.
- Si entra un RF que lo respalde.
- Al cerrar la etapa productiva, como mejora post-entrega.
- Si aparece un defecto en produccion que el tipado estatico habria detectado.

En cualquiera de esos casos se retoma desde el nivel 0 con la linea base del punto 7.

## 10. Referencias

- Gobernanza del proyecto: `docs/MEMORIA_PROYECTO.md`, seccion 5.
- Convenciones obligatorias: `.trae/rules/`.
- Auditoria que origino la propuesta (hallazgo CQ-03): `docs/informes/INFORME_AUDITORIA_TECNICA_COMMERCITY_2026-07-30.md`.
- Requerimientos vigentes: `LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md` (version 2026-08-20).
