import { Router } from "express";
import pool from "../db.js";
import { authenticate, comparePassword, createSession, destroySession, hashPassword, publicUser, requireRole } from "../auth.js";
import { ApiError, isObject, nonNegativeInteger, parseId, positiveInteger, requiredString, validEmail, validPrice } from "../validation.js";

const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const userFields = "id, name, email, role, active";
const productFields = "id, seller_id AS sellerId, name, description, price, stock, category, image, created_at AS createdAt";
const roles = ["buyer", "vendor"];

function priceToCents(value) {
  const text = String(value);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new ApiError(400, "Precio inválido");
  return Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
}

function jsonValue(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

router.get("/api/health", asyncRoute(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}));

router.post("/api/auth/register", asyncRoute(async (req, res) => {
  const name = requiredString(req.body?.name, "name", 120);
  const email = validEmail(req.body?.email);
  const password = requiredString(req.body?.password, "password", 200);
  if (password.length < 8) throw new ApiError(400, "La contraseña debe tener al menos 8 caracteres");
  const role = req.body?.role === undefined ? "buyer" : req.body.role;
  if (!roles.includes(role)) throw new ApiError(400, "Rol inválido");
  const passwordHash = await hashPassword(password);
  let result;
  try {
    [result] = await pool.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name, email, passwordHash, role]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "No se pudo crear la cuenta");
    throw error;
  }
  const user = { id: result.insertId, name, email, role, active: true };
  await createSession(user.id, res);
  res.status(201).json({ user: publicUser(user) });
}));

router.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = validEmail(req.body?.email);
  const password = requiredString(req.body?.password, "password", 200);
  const [users] = await pool.execute(`SELECT ${userFields}, password_hash FROM users WHERE email = ? LIMIT 1`, [email]);
  if (!users.length || !users[0].active || !(await comparePassword(password, users[0].password_hash))) throw new ApiError(401, "Correo o contraseña inválidos");
  await createSession(users[0].id, res);
  res.json({ user: publicUser(users[0]) });
}));

router.post("/api/auth/logout", asyncRoute(async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
}));

router.get("/api/auth/me", authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

router.get("/api/products", asyncRoute(async (req, res) => {
  const conditions = [];
  const values = [];
  if (req.query.q !== undefined) {
    const query = requiredString(req.query.q, "q", 120);
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    values.push(`%${query}%`, `%${query}%`);
  }
  if (req.query.category !== undefined) {
    conditions.push("p.category = ?");
    values.push(requiredString(req.query.category, "category", 100));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [products] = await pool.execute(`SELECT ${productFields} FROM products p ${where} ORDER BY p.created_at DESC`, values);
  res.json({ products });
}));

router.get("/api/products/:id", asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  const [products] = await pool.execute(`SELECT ${productFields} FROM products p WHERE p.id = ?`, [id]);
  if (!products.length) throw new ApiError(404, "Producto no encontrado");
  res.json({ product: products[0] });
}));

router.post("/api/products", authenticate, requireRole("vendor"), asyncRoute(async (req, res) => {
  const name = requiredString(req.body?.name, "name", 180);
  const description = requiredString(req.body?.description, "description", 5000);
  const price = validPrice(req.body?.price);
  const stock = nonNegativeInteger(req.body?.stock, "stock");
  const category = requiredString(req.body?.category, "category", 100);
  const image = req.body?.image == null || req.body.image === "" ? null : requiredString(req.body.image, "image", 2048);
  const [result] = await pool.execute("INSERT INTO products (seller_id, name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)", [req.user.id, name, description, price, stock, category, image]);
  const [products] = await pool.execute(`SELECT ${productFields} FROM products p WHERE p.id = ?`, [result.insertId]);
  res.status(201).json({ product: products[0] });
}));

router.patch("/api/products/:id", authenticate, requireRole("vendor"), asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  if (!isObject(req.body)) throw new ApiError(400, "Cuerpo inválido");
  const validators = {
    name: (value) => requiredString(value, "name", 180),
    description: (value) => requiredString(value, "description", 5000),
    price: (value) => validPrice(value),
    stock: (value) => nonNegativeInteger(value, "stock"),
    category: (value) => requiredString(value, "category", 100),
    image: (value) => value === null || value === "" ? null : requiredString(value, "image", 2048),
  };
  const fields = Object.keys(req.body);
  if (!fields.length || fields.some((field) => !Object.hasOwn(validators, field))) throw new ApiError(400, "Campos de producto inválidos");
  const values = fields.map((field) => validators[field](req.body[field]));
  const [result] = await pool.execute(`UPDATE products SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ? AND seller_id = ?`, [...values, id, req.user.id]);
  if (!result.affectedRows) throw new ApiError(404, "Producto no encontrado");
  const [products] = await pool.execute(`SELECT ${productFields} FROM products p WHERE p.id = ?`, [id]);
  res.json({ product: products[0] });
}));

router.delete("/api/products/:id", authenticate, requireRole("vendor"), asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  const [result] = await pool.execute("DELETE FROM products WHERE id = ? AND seller_id = ?", [id, req.user.id]);
  if (!result.affectedRows) throw new ApiError(404, "Producto no encontrado");
  res.status(204).end();
}));

router.post("/api/orders", authenticate, asyncRoute(async (req, res) => {
  if (!Array.isArray(req.body?.items) || !req.body.items.length || req.body.items.length > 100) throw new ApiError(400, "Artículos del pedido inválidos");
  const quantities = new Map();
  for (const item of req.body.items) {
    if (!isObject(item)) throw new ApiError(400, "Artículo inválido");
    const id = parseId(item.productId, "productId");
    const quantity = positiveInteger(item.quantity, "quantity");
    const totalQuantity = (quantities.get(id) || 0) + quantity;
    if (!Number.isSafeInteger(totalQuantity)) throw new ApiError(400, "Cantidad inválida");
    quantities.set(id, totalQuantity);
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const lineItems = [];
    let totalCents = 0;
    for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a - b)) {
      const [products] = await connection.execute("SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE", [productId]);
      if (!products.length || products[0].stock < quantity) throw new ApiError(400, "Uno o más productos no están disponibles");
      const unitPriceCents = priceToCents(products[0].price);
      totalCents += unitPriceCents * quantity;
      if (!Number.isSafeInteger(totalCents)) throw new ApiError(400, "Total fuera de rango");
      lineItems.push({ productId, name: products[0].name, unitPrice: unitPriceCents / 100, quantity });
    }
    const [order] = await connection.execute("INSERT INTO orders (user_id, status, total) VALUES (?, 'PENDING_PAYMENT', ?)", [req.user.id, totalCents / 100]);
    for (const item of lineItems) {
      await connection.execute("INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)", [order.insertId, item.productId, item.name, item.unitPrice, item.quantity]);
      await connection.execute("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.productId]);
    }
    await connection.commit();
    res.status(201).json({ order: { id: order.insertId, status: "PENDING_PAYMENT", total: totalCents / 100, items: lineItems } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.get("/api/orders/mine", authenticate, asyncRoute(async (req, res) => {
  const [orders] = await pool.execute("SELECT id, status, total, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  for (const order of orders) {
    const [items] = await pool.execute("SELECT product_id AS productId, product_name AS name, unit_price AS unitPrice, quantity FROM order_items WHERE order_id = ? ORDER BY id", [order.id]);
    const [returns] = await pool.execute("SELECT id, reason, status, created_at AS createdAt FROM return_requests WHERE order_id = ? ORDER BY id DESC", [order.id]);
    order.items = items;
    order.returns = returns;
  }
  res.json({ orders });
}));

router.patch("/api/orders/:id/return", authenticate, asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  const reason = requiredString(req.body?.reason, "reason", 1000);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute("SELECT id, status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE", [id, req.user.id]);
    if (!orders.length) throw new ApiError(404, "Pedido no encontrado");
    if (orders[0].status !== "PAID") throw new ApiError(409, "Solo se pueden solicitar devoluciones de pedidos pagados");
    const [existing] = await connection.execute("SELECT id FROM return_requests WHERE order_id = ? LIMIT 1", [id]);
    if (existing.length) throw new ApiError(409, "Ya existe una solicitud de devolución");
    const [result] = await connection.execute("INSERT INTO return_requests (order_id, user_id, reason, status) VALUES (?, ?, ?, 'PENDING')", [id, req.user.id, reason]);
    await connection.commit();
    res.status(201).json({ returnRequest: { id: result.insertId, orderId: id, reason, status: "PENDING" } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.get("/api/users/me", authenticate, asyncRoute(async (req, res) => {
  const [users] = await pool.execute("SELECT id, name, email, role, settings FROM users WHERE id = ?", [req.user.id]);
  res.json({ user: { ...users[0], settings: jsonValue(users[0].settings) || {} } });
}));

router.patch("/api/users/me", authenticate, asyncRoute(async (req, res) => {
  if (!isObject(req.body)) throw new ApiError(400, "Cuerpo inválido");
  const allowed = ["name", "email", "settings"];
  const fields = Object.keys(req.body);
  if (!fields.length || fields.some((field) => !allowed.includes(field))) throw new ApiError(400, "Campos de perfil inválidos");
  const values = fields.map((field) => {
    if (field === "name") return requiredString(req.body.name, "name", 120);
    if (field === "email") return validEmail(req.body.email);
    if (!isObject(req.body.settings) || Buffer.byteLength(JSON.stringify(req.body.settings), "utf8") > 10000) throw new ApiError(400, "Configuración inválida");
    return JSON.stringify(req.body.settings);
  });
  try {
    const [result] = await pool.execute(`UPDATE users SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`, [...values, req.user.id]);
    if (!result.affectedRows) throw new ApiError(404, "Usuario no encontrado");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "Ese correo ya está registrado");
    throw error;
  }
  const [users] = await pool.execute("SELECT id, name, email, role, settings FROM users WHERE id = ?", [req.user.id]);
  res.json({ user: { ...users[0], settings: jsonValue(users[0].settings) || {} } });
}));

router.get("/api/conversations", authenticate, asyncRoute(async (req, res) => {
  const [conversations] = await pool.execute("SELECT c.id, c.created_at AS createdAt, MAX(m.created_at) AS lastMessageAt FROM conversations c JOIN conversation_participants cp ON cp.conversation_id = c.id LEFT JOIN messages m ON m.conversation_id = c.id WHERE cp.user_id = ? GROUP BY c.id ORDER BY COALESCE(lastMessageAt, c.created_at) DESC", [req.user.id]);
  res.json({ conversations });
}));

async function requireParticipant(conversationId, userId) {
  const [rows] = await pool.execute("SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?", [conversationId, userId]);
  if (!rows.length) throw new ApiError(404, "Conversación no encontrada");
}

router.get("/api/conversations/:id/messages", authenticate, asyncRoute(async (req, res) => {
  const conversationId = parseId(req.params.id, "id");
  await requireParticipant(conversationId, req.user.id);
  const [messages] = await pool.execute("SELECT m.id, m.sender_id AS senderId, u.name AS senderName, m.body, m.created_at AS createdAt FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at, m.id", [conversationId]);
  res.json({ messages });
}));

router.post("/api/conversations/:id/messages", authenticate, asyncRoute(async (req, res) => {
  const conversationId = parseId(req.params.id, "id");
  await requireParticipant(conversationId, req.user.id);
  const body = requiredString(req.body?.body, "body", 5000);
  const [result] = await pool.execute("INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)", [conversationId, req.user.id, body]);
  res.status(201).json({ message: { id: result.insertId, conversationId, senderId: req.user.id, body } });
}));

router.post("/api/reports", authenticate, asyncRoute(async (req, res) => {
  const productId = parseId(req.body?.productId, "productId");
  const reason = requiredString(req.body?.reason, "reason", 180);
  const [products] = await pool.execute("SELECT id FROM products WHERE id = ?", [productId]);
  if (!products.length) throw new ApiError(404, "Producto no encontrado");
  const [result] = await pool.execute("INSERT INTO reports (product_id, user_id, reason) VALUES (?, ?, ?)", [productId, req.user.id, reason]);
  res.status(201).json({ report: { id: result.insertId, productId, reason, status: "PENDING" } });
}));

router.get("/api/admin/users", authenticate, requireRole("admin"), asyncRoute(async (req, res) => {
  const [users] = await pool.execute(`SELECT ${userFields}, created_at AS createdAt FROM users ORDER BY created_at DESC`);
  res.json({ users });
}));

router.get("/api/admin/products", authenticate, requireRole("admin"), asyncRoute(async (req, res) => {
  const [products] = await pool.execute(`SELECT ${productFields} FROM products p ORDER BY p.created_at DESC`);
  res.json({ products });
}));

router.get("/api/admin/reports", authenticate, requireRole("admin"), asyncRoute(async (req, res) => {
  const [reports] = await pool.execute("SELECT id, product_id AS productId, user_id AS userId, reason, status, created_at AS createdAt FROM reports ORDER BY created_at DESC");
  res.json({ reports });
}));

router.patch("/api/admin/reports/:id", authenticate, requireRole("admin"), asyncRoute(async (req, res) => {
  const id = parseId(req.params.id);
  const status = req.body?.status;
  if (!["PENDING", "REVIEWED", "RESOLVED", "REJECTED"].includes(status)) throw new ApiError(400, "Estado de reporte inválido");
  const [result] = await pool.execute("UPDATE reports SET status = ? WHERE id = ?", [status, id]);
  if (!result.affectedRows) throw new ApiError(404, "Reporte no encontrado");
  res.json({ report: { id, status } });
}));

router.get("/api/admin/orders", authenticate, requireRole("admin"), asyncRoute(async (req, res) => {
  const [orders] = await pool.execute("SELECT id, user_id AS userId, status, total, created_at AS createdAt FROM orders ORDER BY created_at DESC");
  res.json({ orders });
}));

export default router;
