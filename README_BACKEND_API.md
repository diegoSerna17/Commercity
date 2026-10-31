# CommerCity - Backend y API REST

Rama de demostracion con **solo el backend y la documentacion de la API**.
No incluye frontend, aplicaciones movil o escritorio, materiales internos ni
credenciales.

## Contenido

| Ruta | Que es |
|---|---|
| `backend/` | Servidor Express, controladores, rutas, esquemas, pruebas y scripts |
| `docs/api/` | OpenAPI 3.1, entidades, inventario y coleccion Postman |
| `schema_commercity.sql` | Esquema de la base local (`commercity_dev`) |
| `seed_commercity.sql` | Datos de prueba |
| `Dockerfile` y `docker-compose.yml` | Entorno de desarrollo con MySQL |
| `VERSION` | Version del proyecto |

## Requisitos

- Node.js 22 o superior.
- MySQL 8.4 en `127.0.0.1:3306`.

## Arranque local

1. Crear la base y cargar datos (solo en una instancia local desechable):

```powershell
Get-Content .\schema_commercity.sql -Raw | mysql -u root -p --default-character-set=utf8mb4
Get-Content .\seed_commercity.sql -Raw | mysql -u root -p --default-character-set=utf8mb4
```

2. Configurar el backend:

```powershell
cd backend
Copy-Item .env.example .env
# Completar DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME y JWT_SECRET
npm install
npm start
```

3. Verificar:

- Salud: `http://localhost:3000/health`
- Documentacion: `http://localhost:3000/api/docs`
- OpenAPI: `http://localhost:3000/api/openapi.json`

## Postman

Importar:

- `docs/api/postman/CommerCity.postman_collection.json`
- `docs/api/postman/CommerCity.local.postman_environment.json`

Ejecutar primero la carpeta `00 - Preparacion`. No ejecutar `98 - No ejecutar en lote`.

## Pruebas

```powershell
cd backend
$env:ALLOW_DESKTOP_ORIGINS='false'
npm test
npm run test:coverage
```

## Alcance

- 74 operaciones en 13 routers.
- Contrato uniforme `{ success, data }` / `{ success, error }`.
- JWT, roles, validacion con Zod y transacciones para el dinero.
- 19 tablas y 12 migraciones.

Esta rama es para demostracion y pruebas locales. No es un entorno de
produccion y no contiene secretos.
