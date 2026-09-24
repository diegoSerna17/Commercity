import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, nonNegativeInteger, parseId, positiveInteger, requiredString, validEmail, validPrice } from "./validation.js";

test("validates normalized strings and email", () => {
  assert.equal(requiredString("  producto ", "name"), "producto");
  assert.equal(validEmail("User@Example.com"), "user@example.com");
  assert.throws(() => validEmail("bad-email"), ApiError);
});

test("validates identifiers, quantities, stock, and money values", () => {
  assert.equal(parseId("12"), 12);
  assert.equal(positiveInteger("3", "quantity"), 3);
  assert.equal(nonNegativeInteger(0, "stock"), 0);
  assert.equal(validPrice("10.25"), 10.25);
  assert.throws(() => parseId("0"), ApiError);
  assert.throws(() => positiveInteger(0, "quantity"), ApiError);
  assert.throws(() => validPrice(1.001), ApiError);
});
