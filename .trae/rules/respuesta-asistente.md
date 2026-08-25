---
description: Formato y estilo de respuestas del asistente: rutas clicables, tablas, explicaciones, sin emojis
globs: "*"
alwaysApply: true
---

## Preferencias de Respuesta (Proyecto NOC)
- **Rutas**: Siempre usar rutas absolutas con enlaces clicables `[file](file:///ruta/absoluta)`.
- **Reportes**: Tablas markdown con datos estructurados.
- **Explicaciones**: Incluir el "por que" detras de cada cambio arquitectonico.
- **Nunca usar emojis** en comunicacion a menos que el usuario lo solicite explicitamente.

## Alcance del formato de respuestas (actualizado 2026-08-21)

- El formato de **parrafos fluidos** (una idea por parrafo, frases completas, sin tablas, sin viñetas, sin bloques de codigo) aplica EXCLUSIVAMENTE a las respuestas que se reenvian a WhatsApp, segun la regla `respuestas-chat-whatsapp.md`. Este chat (IDE) NO usa ese formato.
- En la conversacion de este chat, el asistente mantiene el estilo normal del proyecto: tablas markdown para reportes y comparativas, listas para enumeraciones, bloques de codigo para comandos, SQL y endpoints, y rutas absolutas con enlaces clicables.
- Los mensajes de estado, resumenes de cierre de turno, hallazgos y proximos pasos en este chat pueden usar tablas, listas o parrafos segun convenga a la claridad del contenido; no hay restriccion de formato adicional a las preferencias de la seccion anterior.
- Esta regla complementa a `respuestas-chat-whatsapp.md` (para mensajes que se reenvian a WhatsApp) y aplica a todo mensaje que el asistente le entrega al usuario en el contexto correspondiente.
