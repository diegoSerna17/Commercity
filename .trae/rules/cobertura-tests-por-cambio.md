## Cobertura y Tests por Cambio (Proyecto CommerCity)

- **OBLIGATORIO**: al finalizar CADA cambio de codigo de produccion (fix, feature, refactor, nuevo modulo), revisar y actualizar los tests ANTES de reportar el cambio como terminado o de commitear. Complementa [testing-commercity.md](testing-commercity.md) (umbral minimo), [ahorro-tokens-test-manual.md](ahorro-tokens-test-manual.md) (la IA NO ejecuta tests, entrega comandos) y [documentacion-cambios.md](documentacion-cambios.md).

### Flujo obligatorio tras cada cambio

1. **Entregar comandos de las suites afectadas**: la IA indica los comandos vitest de los modulos modificados (ej: `node node_modules\vitest\vitest.mjs run src/server/__tests__/<modulo>.test.js`) y el USUARIO los ejecuta en consola (regla ahorro-tokens-test-manual.md). Todo debe pasar antes de continuar; la IA interpreta la salida que pega el usuario.
2. **Verificar cobertura**: entregar el comando `node node_modules\vitest\vitest.mjs run --coverage` para que el usuario lo ejecute. La cobertura NO debe bajar del nivel previo al cambio (referencia vigente: Lines 93.53%, Statements 93%, umbral minimo del proyecto 60%). Si baja, agregar los tests faltantes.
3. **Crear/actualizar tests de codigo nuevo**: toda rama nueva o funcion nueva debe tener test, con el patron de mocks de `mysql2/promise` + Supertest ya usado en la suite:
   - Fix con bug reproducible -> test que reproduce el bug primero, luego el fix.
   - Mocks de Selenium/Dynamics -> no aplica en este proyecto (regla test-patterns-noc es del proyecto NOC).
   - Cobertura de ramas/errores -> ampliar el test del modulo afectado.
4. **No romper tests existentes**: si un cambio modifica el comportamiento interno, actualizar los tests existentes afectados conservando su intencion.
5. **Documentar los tests**: anotar en `informes/CHANGELOG.md` la evidencia del cambio con el conteo passed segun [documentacion-cambios.md](documentacion-cambios.md) (campo **Evidencia**). El conteo passed se confirma con la salida que pega el usuario.

### Restricciones

- El umbral minimo de cobertura (60%) NO se reduce; la meta vigente es no bajar del nivel previo (referencia 93.53% en Lines).
- Los tests NO requieren BD real: usan mock de `mysql2/promise` (Vitest + Supertest). La verificacion contra BD real (E2E) es una capa aparte que coordina el lider y la ejecuta el usuario.
- La IA NO ejecuta vitest ni coverage por su cuenta (ver ahorro-tokens-test-manual.md).
