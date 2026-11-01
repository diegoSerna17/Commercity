import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToast } from "./useToast.js";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("empieza oculto y sin mensaje", () => {
    // Arrange / Act
    const { result } = renderHook(() => useToast());

    // Assert
    expect(result.current.toast).toEqual({
      visible: false,
      msg: "",
      isError: false,
    });
  });

  it("muestra el mensaje y el estado de error", () => {
    // Arrange
    const { result } = renderHook(() => useToast());

    // Act
    act(() => result.current.showToast("Fallo al guardar", true));

    // Assert
    expect(result.current.toast).toEqual({
      visible: true,
      msg: "Fallo al guardar",
      isError: true,
    });
  });

  it("oculta el aviso a los 3000 ms por defecto", () => {
    // Arrange
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast("Guardado"));

    // Act
    act(() => {
      vi.advanceTimersByTime(2999);
    });

    // Assert
    expect(result.current.toast.visible).toBe(true);

    // Act
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Assert
    expect(result.current.toast.visible).toBe(false);
  });

  it("respeta la duracion personalizada", () => {
    // Arrange
    const { result } = renderHook(() => useToast(3500));
    act(() => result.current.showToast("Guardado"));

    // Act
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Assert
    expect(result.current.toast.visible).toBe(true);

    // Act
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Assert
    expect(result.current.toast.visible).toBe(false);
  });

  it("reinicia el temporizador cuando llega otro aviso", () => {
    // Arrange
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast("Primero"));

    // Act
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => result.current.showToast("Segundo"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Assert
    expect(result.current.toast).toMatchObject({ visible: true, msg: "Segundo" });

    // Act
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(result.current.toast.visible).toBe(false);
  });

  it("limpia el temporizador al desmontar", () => {
    // Arrange
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useToast());
    act(() => result.current.showToast("Temporal"));

    // Act
    unmount();

    // Assert
    expect(clearSpy).toHaveBeenCalled();
  });
});
