import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Lote 3 (1.5.8): uncaughtException debe cerrar el servidor y el pool de forma
// ordenada (igual que unhandledRejection/SIGTERM), no dejar el proceso vivo en
// un estado desconocido. Se mockean app y el pool para no abrir puertos ni BD.
const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  listen: vi.fn(),
  end: vi.fn(),
}));

vi.mock("../app.js", () => ({ default: { listen: mocks.listen } }));
vi.mock("../config/db.js", () => ({ default: { end: mocks.end } }));

describe("server.js - cierre ordenado ante uncaughtException", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.listen.mockReturnValue({ close: mocks.close });
    mocks.close.mockImplementation((callback) => callback(null));
    mocks.end.mockResolvedValue();
    vi.spyOn(process, "exit").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registra un handler y cierra servidor + pool con codigo 1", async () => {
    const handlers = {};
    vi.spyOn(process, "on").mockImplementation((evento, handler) => {
      handlers[evento] = handler;
      return process;
    });

    await import("../server.js");

    expect(handlers.uncaughtException).toBeTypeOf("function");

    handlers.uncaughtException(new Error("boom no controlado"));

    await vi.waitFor(() => {
      expect(mocks.close).toHaveBeenCalledTimes(1);
      expect(mocks.end).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
