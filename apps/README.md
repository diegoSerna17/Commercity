# apps/ — Snapshot versionado de las aplicaciones (2026-09-28)

Copia trackeable (aprobada por Daniel 2026-09-28) de las dos aplicaciones cliente **cableadas a la API REST de CommerCity**. La fuente local histórica vive en `docs/AVANCES/...` (gitignorada); desde este commit, **`apps/` es la fuente versionada**.

| App | Carpeta | Stack | Conexión a la API |
|---|---|---|---|
| Móvil (Android/iOS) | `apps/movil/` | Ionic **Capacitor 8.4**, HTML/CSS/JS puro (`www/`) | `www/api.js` → `http://10.0.2.2:3000` (emulador) o IP-LAN; 69 endpoints |
| Escritorio (Windows) | `apps/escritorio/` | **Electron 35** + electron-builder, `src/` | `src/api.js` → `http://localhost:3000`; 69 endpoints |

En ambas apps, `index.html` carga `api.js` **antes** de `app.js`; todos los handlers mock (auth, catálogo, carrito, pago, perfil, vendedor, admin, social, chat, notificaciones) migraron a llamadas reales con JWT (`commercity_token`). Credenciales hardcodeadas eliminadas (`admin@gmail.com/admin123`, `admin/admin123`, `juan_giraldo/1234`, `rem_pass` en claro).

## Descargar el código (rama PREVIEW del repo oficial)

El código de estas apps se publica para pruebas del equipo en la rama **`PREVIEW`** de `https://github.com/diegoSerna17/Commercity`:

```bash
# Clon nuevo
git clone -b PREVIEW https://github.com/diegoSerna17/Commercity.git
cd Commercity

# Actualizar un clon existente
git fetch commercycity
git checkout PREVIEW
git pull commercycity PREVIEW
```

Antes de compilar, sigue la configuración general del proyecto en el `README.md` de la raíz (`.env` con `DB_NAME=commercity_v2` e importar `schema_commercity.sql` + `seed_commercity.sql`).

## E2E (2026-09-28, backend vivo `localhost:3000`, BD `commercity_v2`)

- **Runner 69 endpoints: 129/129 OK** — `docs/AVANCES/PRUEBAS/ejecutar_pruebas.mjs`
- **Capa de red de ambos `api.js`: 102/102 OK** — `docs/AVANCES/PRUEBAS/harness_capa_red.mjs`
- Evidencia: `docs/informes/EVIDENCIA_E2E_CAPA_RED_2026-09-28.md` (+ informes de rama en `docs/informes/INFORME_RAMA_{MOVIL,ESCRITORIO}_2026-09-27.md`, secciones "Cierre de pendings 2026-09-28")
- Backend: 328/328 tests (commit `14d6056`: `GET /api/tienda/validacion` RF130-139 + CORS Electron).

## Build

### APK (Móvil) — requiere Android Studio/SDK (no incluido en este repo)

```bash
cd apps/movil
npm install
npx cap sync android        # regenera android/app/src/main/assets/public desde www/
npx cap open android        # Android Studio -> Build > Build Bundle(s)/APK(s) > Build APK(s)
```

- **`android/app/commercity.keystore` NO se versiona** (excluido por `**/*.keystore`): antes de cualquier release público **rotar la firma** y guardarla fuera del repo/CI.
- Variante de razonamiento de los agentes: ver `opencode.jsonc` (gitignorado, configuración local).

### EXE (Escritorio)

```bash
cd apps/escritorio
npm install
npm run build               # electron-builder NSIS -> dist/CommerCity Setup 2.0.0.exe
```

- `build.win.signAndEditExecutable: false` en `package.json`: evita la extracción de `winCodeSign` (requiere privilegio de symlinks en Windows). **Para release público, habilitar firma real.**
- `dist/` se genera localmente (ignorado por git).

## Exclusiones de este snapshot (deliberadas)

`node_modules/`, `dist/`, `**/*.keystore`, `android/local.properties`, `android/.gradle/`,
`android/app/src/main/assets/public/` (regenerable con `cap sync`), `www/index_original.html`,
`temp_apk_extract/`, `temp_v124/`, scripts parche (`fix-*.js`).
