# VOCETO-2.0-COMMERCITY-SENA-ADSO-35
VOCETO 2 COMMERCITY SENA ADSO35 PROPUESTA MEJORADA AL ORIGINAL
# 📦 CommerCity - Desktop App (Nueva Propuesta)

Este proyecto representa una nueva propuesta mejorada de CommerCity, basada en la versión original, pero con una arquitectura más limpia, mejor estructura de empaquetado y soporte completo para instalación en Windows mediante Electron Builder.

## 📥 Obtener el código (rama PREVIEW)

La app se distribuye para pruebas del equipo en la rama **`PREVIEW`** del repo oficial:

```bash
git clone -b PREVIEW https://github.com/diegoSerna17/Commercity.git
cd Commercity/apps/escritorio
npm install
npm run build   # genera dist/CommerCity Setup 2.0.0.exe
```

La configuración del proyecto (`.env` con `DB_NAME=commercity_v2`, importar `schema_commercity.sql` + `seed_commercity.sql`) está en el `README.md` de la raíz.

## 🧭 ¿Qué es esta versión?

Esta versión de CommerCity no es solo una copia del proyecto original, sino una evolución del concepto inicial, pensada para:

- Mejor rendimiento en escritorio
- Empaquetado profesional con instalador .exe
- Estructura más organizada del proyecto
- Preparación para distribución real

## 🚀 Diferencias con el CommerCity original

- Implementación de sistema de build con Electron Builder
- Generación de instalador tipo setup (.exe)
- Configuración de NSIS para instalación en Windows
- Preparado para distribución como aplicación de escritorio
- Flujo más estable entre desarrollo y producción

## 💿 Objetivo de esta nueva propuesta

Transformar CommerCity en una aplicación más cercana a un producto real, capaz de:

- Instalarse como cualquier software de Windows
- Ejecutarse sin necesidad de terminal
- Ser distribuido como aplicación de escritorio completa

## 🧠 Enfoque del proyecto

Esta versión busca llevar la idea original de CommerCity hacia un entorno más profesional, donde la aplicación deja de ser solo un proyecto de desarrollo y pasa a comportarse como un software instalable real.

## 🎯 Resultado final

Con esta nueva propuesta se obtiene:

- Aplicación de escritorio funcional
- Instalador .exe listo para usuarios
- Base preparada para futuras mejoras y escalabilidad
