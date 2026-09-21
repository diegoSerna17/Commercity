# Plan consolidado del Sprint API REST

- **Fecha de consolidación**: 2026-09-21 09:01
- **Autor**: Daniel Palacios
- **Fuente**: plan histórico del Sprint API REST y estado verificable del repositorio local
- **Objetivo**: integrar web, móvil y escritorio con el backend central mediante contratos REST verificables.

## Alcance

1. Mantener el backend central con sus routers, contratos `{ success, data }` y respuestas de error estructuradas.
2. Completar la integración web contra la API real.
3. Validar los flujos de autenticación, catálogo, carrito, pedidos, historial, tienda, administración y funcionalidades sociales.
4. Ejecutar evidencia E2E contra `commercity_v2` utilizando el backend en `http://localhost:3000`.
5. Mantener las pruebas unitarias y de integración sin reducir la cobertura existente.

## Estado de cierre

| Área | Estado | Pendiente |
|---|---|---|
| Backend central | Integrado | Verificar suite manual después de reincorporar Seguidores |
| Web React | Integración API aplicada en `feature/web-integracion-api` | E2E completo y aprobación para sincronización con `commercycity/main` |
| Seguidores | Router, controller, montaje y prueba reincorporados | Ejecutar Vitest y E2E real |
| Móvil | Revisión documental disponible | Corregir roles y endpoints incompatibles |
| Escritorio | Evidencia histórica disponible | Confirmar cliente API y E2E actual |

## Criterios de aceptación

- Los endpoints consumidos por la web responden contra el backend en puerto 3000.
- El módulo Seguidores cubre autenticación, validación, auto-seguimiento, duplicados, alta, baja y listados.
- La evidencia E2E no contiene tokens, contraseñas ni credenciales.
- La comparación contra `commercycity/main` se revisa antes de cualquier publicación.
- El changelog registra resultado, evidencia y pendientes reales.

## Evidencias relacionadas

- `AVANCES/PRUEBAS/INFORME_PRUEBAS.md`: evidencia histórica de 50 pruebas API; requiere revalidación porque usa puerto 5000.
- `AVANCES/SPRINT 1 API REST/CARLOS PEREA/entrega/entrega/evidencia-E2E-seguidores.md`: evidencia histórica del módulo Seguidores.
- `informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md`: estado consolidado de entregas.
- `informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md`: contrato consolidado de rutas.
