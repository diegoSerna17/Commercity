import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// B1 (auditoria 2026-11-04): el esquema canonico debe reflejar las migraciones
// 015-019 y registrarlas en schema_migrations con el checksum real de cada
// archivo, para que `npm run db:migrate` no las reaplique sobre una base creada
// desde el esquema. Este test es estatico: no necesita MySQL.
const raizRepo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const dirMigraciones = join(dirname(fileURLToPath(import.meta.url)), "..", "db");
const schema = readFileSync(join(raizRepo, "schema_commercity.sql"), "utf8");

const MIGRACIONES_015_020 = [
  "015_token_version.sql",
  "016_auditoria_acciones.sql",
  "017_datos_bancarios_longitudes.sql",
  "018_calificaciones_unique_vendedor.sql",
  "019_perfil_terminos_y_pausa_productos.sql",
  "020_indices_rendimiento.sql",
];

function bloqueCreateTable(nombre) {
  const match = schema.match(
    new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?${nombre} \\(([\\s\\S]*?)\\) ENGINE=InnoDB`)
  );
  return match ? match[1] : "";
}

describe("schema_commercity.sql vs migraciones 015-019 (B1)", () => {
  it("usuarios incluye token_version, password_changed_at y el indice de recuperacion", () => {
    const usuarios = bloqueCreateTable("usuarios");
    expect(usuarios).toMatch(/\btoken_version\s+INT\s+NOT NULL DEFAULT 0/);
    expect(usuarios).toMatch(/\bpassword_changed_at\s+DATETIME NULL/);
    expect(usuarios).toMatch(/INDEX idx_usuarios_token_recuperacion \(token_recuperacion\)/);
  });

  it("existe la tabla auditoria_acciones de la migracion 016", () => {
    const auditoria = bloqueCreateTable("auditoria_acciones");
    expect(auditoria).not.toBe("");
    for (const columna of ["actor_id", "accion", "objetivo_tipo", "objetivo_id", "detalle", "ip", "fecha"]) {
      expect(auditoria).toMatch(new RegExp(`\\b${columna}\\b`));
    }
    expect(auditoria).toMatch(/FOREIGN KEY \(actor_id\) REFERENCES usuarios\(id\) ON DELETE SET NULL/);
  });

  it("datos_bancarios tiene las longitudes de la migracion 017", () => {
    const datosBancarios = bloqueCreateTable("datos_bancarios");
    expect(datosBancarios).toMatch(/titular_nombre VARCHAR\(255\) NOT NULL/);
    expect(datosBancarios).toMatch(/\bbanco VARCHAR\(100\) NOT NULL/);
  });

  it("calificaciones_vendedores usa el UNIQUE compuesto de la migracion 018", () => {
    const calificaciones = bloqueCreateTable("calificaciones_vendedores");
    expect(calificaciones).toMatch(/UNIQUE KEY uq_pedido_vendedor_calif \(pedido_id, vendedor_id\)/);
    expect(calificaciones).not.toMatch(/UNIQUE KEY[^\n]*\(pedido_id\)/);
  });

  it("productos incluye pausado y eliminado_por_vendedor de la migracion 019", () => {
    const productos = bloqueCreateTable("productos");
    expect(productos).toMatch(/\bpausado\s+TINYINT\(1\)\s+NOT NULL DEFAULT 0/);
    expect(productos).toMatch(/\beliminado_por_vendedor\s+TINYINT\(1\)\s+NOT NULL DEFAULT 0/);
    expect(productos).toMatch(/INDEX idx_productos_pausado_vendedor \(pausado, eliminado_por_vendedor\)/);
  });

  it("productos incluye el indice del catalogo de la migracion 020", () => {
    const productos = bloqueCreateTable("productos");
    expect(productos).toMatch(
      /INDEX idx_productos_catalogo \(eliminado_por_admin, pausado, eliminado_por_vendedor, estado, id\)/
    );
  });

  it("usuarios incluye terminos_aceptados_en de la migracion 019", () => {
    const usuarios = bloqueCreateTable("usuarios");
    expect(usuarios).toMatch(/\bterminos_aceptados_en\s+DATETIME NULL/);
  });

  it("schema_migrations registra 015-020 con el checksum real de cada archivo", () => {
    for (const archivo of MIGRACIONES_015_020) {
      // El ledger se genero en checkouts con finales de linea distintos (unos
      // LF, otros CRLF). Se aceptan las dos variantes del MISMO contenido:
      // cualquier edicion real cambia ambos hashes y sigue fallando.
      const contenido = readFileSync(join(dirMigraciones, archivo), "utf8").replace(/\r\n/g, "\n");
      const hashes = [
        createHash("sha256").update(contenido, "utf8").digest("hex"),
        createHash("sha256").update(contenido.replace(/\n/g, "\r\n"), "utf8").digest("hex"),
      ];
      const registrado = hashes.some((h) => schema.includes(`('${archivo}', '${h}')`));
      expect(registrado, `${archivo}: ningun checksum del archivo coincide con schema_migrations`).toBe(true);
    }
  });

  it("la migracion 021 agrega CHECK (stock >= 0) a productos", () => {
    // Lote 3 (1.5.8): la BD debe rechazar stock negativo aunque un UPDATE
    // manual o una carrera se salte la validacion de la aplicacion.
    const sql = readFileSync(
      join(dirMigraciones, "021_check_stock_no_negativo.sql"),
      "utf8"
    );
    expect(sql).toMatch(/ALTER TABLE\s+productos/i);
    expect(sql).toMatch(/CHECK\s*\(\s*stock\s*>=\s*0\s*\)/i);
  });
});
