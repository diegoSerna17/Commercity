PS C:\PROYECTOS\COMMER CITY> 
PS C:\PROYECTOS\COMMER CITY> git commit -m "chore: desversiona scripts y .trae/rules y retira informes y LAST VERSION (documentacion en docs/)"
[main 2aecd0a] chore: desversiona scripts y .trae/rules y retira informes y LAST VERSION (documentacion en docs/)
 59 files changed, 13999 deletions(-)
 delete mode 100644 .trae/rules/ahorro-tokens-changelog-manual.md
 delete mode 100644 .trae/rules/ahorro-tokens-version-manual.md
 delete mode 100644 .trae/rules/cobertura-tests-por-cambio.md
 delete mode 100644 .trae/rules/memoria-proyecto.md
 delete mode 100644 .trae/rules/respuesta-asistente.md
 delete mode 100644 .trae/rules/revision-requerimientos.md
 delete mode 100644 LAST VERSION/2/commercity_v2.sql
 delete mode 100644 LAST VERSION/Auditoria_Completa Commercity_Organizado.pdf
 delete mode 100644 LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md
 delete mode 100644 LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md
 delete mode 100644 LAST VERSION/REVISION/Commercity (optimizado)/Commercity (optimizado).md
 delete mode 100644 LAST VERSION/REVISION/Diagrama - commercity_v2.png
 delete mode 100644 LAST VERSION/REVISION/Informe de decisiones criticas y brechas en los requerimientos de implementacion/Informe de decisiones criticas y brechas en los requerimientos de implementacion.md
 delete mode 100644 LAST VERSION/REVISION/WhatsApp Image 2026-08-07 at 11.31.49 PM.jpeg
 delete mode 100644 LAST VERSION/REVISION/informe de nomenclatura/informe de nomenclatura.md
 delete mode 100644 LAST VERSION/schema_commercity_3.sql
 delete mode 100644 LAST VERSION/seed_commercity.sql
 delete mode 100644 "informes/An\303\241lisis del proyecto/An\303\241lisis del proyecto.md"
 delete mode 100644 informes/BRECHAS_CRITICAS_REQUERIMIENTOS_COMMERCITY_2.0_2026-08-04.md
 delete mode 100644 informes/BRECHAS_CRITICAS_REQUERIMIENTOS_COMMERCITY_2026-07-30.md
 delete mode 100644 informes/Brechas Criticas Commercity Requerimientos.pdf
 delete mode 100644 informes/CHANGELOG.md
 delete mode 100644 informes/CHECKLIST_ARRANQUE_SPRINT2_2026-09-07.md
 delete mode 100644 "informes/Cambios de Brechas Cr\303\255ticas REVISION.docx"
 delete mode 100644 "informes/Cambios de Brechas Cr\303\255ticas REVISION/Cambios de Brechas Cr\303\255ticas REVISION.md"
 delete mode 100644 informes/Commercity 2.0 (optimizado 6)/Commercity 2.0 (optimizado 6).md
 delete mode 100644 informes/Commercity 2.0 (optimizado) REVISION.docx
 delete mode 100644 informes/Commercity 2.0 (optimizado) REVISION/Commercity 2.0 (optimizado) REVISION.md
 delete mode 100644 informes/Commercity 2.0 (optimizado)/Commercity 2.0 (optimizado).docx
 delete mode 100644 informes/Commercity 2.0 (optimizado)/Commercity 2.0 (optimizado).md
 delete mode 100644 informes/Commercity 2.0 (optimizado4)/Commercity 2.0 (optimizado4).md  
 delete mode 100644 informes/Commercity 2.0 Final (optimizado)/Commercity 2.0 Final (optimizado).md
 delete mode 100644 informes/FLUJO_UML_EJEMPLO_COMPRA.md
 delete mode 100644 informes/GUIA_INTEGRACION_MOBILE_2026-09-25.md
 delete mode 100644 informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md
 delete mode 100644 informes/INFORME_AUDITORIA_COMPLETA_COMMERCITY_LAST_VERSION_2026-08-07.md
 delete mode 100644 informes/INFORME_AUDITORIA_TECNICA_COMMERCITY_2026-07-30.md
 delete mode 100644 informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md        
 delete mode 100644 informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md
 delete mode 100644 informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.pdf
 delete mode 100644 informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md
 delete mode 100644 informes/INFORME_FINAL_SENA_2026-09-25.md
 delete mode 100644 informes/INFORME_PRUEBAS_CARRITO_2026-08-05.md
 delete mode 100644 informes/INFORME_REQUERIMIENTOS_BACKEND_BD_2026-08-05.md
 delete mode 100644 informes/INFORME_REQUERIMIENTOS_COMMERCITY_2.0_2026-07-30.md
 delete mode 100644 informes/INFORME_REVISION_BASE_DATOS_2026-08-06.md
 delete mode 100644 informes/INFORME_REVISION_BASE_DATOS_2026-08-06.pdf
 delete mode 100644 informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md
 delete mode 100644 informes/INVENTARIO_ENDPOINTS_API_2026-09-05.md
 delete mode 100644 informes/Inventario_Endpoints_API_CommerCity.pdf
 delete mode 100644 informes/PLAN_SCRUM_BACKEND_2026-08-06.md
 delete mode 100644 informes/PLAN_SPRINT_API_REST_2026-08-31.md
 delete mode 100644 informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md
 delete mode 100644 informes/PROTOCOLO_ENTREGA_BACKEND_2026-08-06.md
 delete mode 100644 informes/Plan_Scrum_Backend_CommerCity.pdf
 delete mode 100644 informes/REPORTE_BASE_DE_DATOS_AUDITORIA_2026-08-07.md
 delete mode 100644 informes/SUGERENCIAS DE AGREGADOS Y MEJORAS/SUGERENCIAS DE AGREGADOS Y MEJORAS.md
 delete mode 100644 scripts/actualizar_changelog.ps1
 delete mode 100644 scripts/actualizar_version.ps1
PS C:\PROYECTOS\COMMER CITY> git push origin main
git: 'credential-gh' is not a git command. See 'git --help'.

The most similar command is
        credential-cache
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Delta compression using up to 12 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 309 bytes | 309.00 KiB/s, done.
Total 2 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
To https://github.com/danielpalacios665-sys/ECOMMERCE.git
   a0246f8..2aecd0a  main -> main
PS C:\PROYECTOS\COMMER CITY> 