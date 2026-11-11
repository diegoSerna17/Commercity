import { successResponse, errorResponse } from "../../utils/response.js";
import {
  listarUsuariosAdmin,
  cambiarEstadoUsuario as cambiarEstadoUsuarioAdmin,
  eliminarUsuarioAdmin,
} from "../../services/admin.service.js";

export const getUsuarios = async (req, res, next) => {
  try {
    // B-9: paginacion validada con Zod en la ruta (default 50, max 100).
    const { pagina, por_pagina: porPagina } = req.query;

    const { usuarios, total } = await listarUsuariosAdmin({
      pagina,
      porPagina,
      q: req.query.q,
    });

    return res.status(200).json({
      success: true,
      message: "Lista de usuarios",
      data: usuarios,
      paginacion: { pagina, por_pagina: porPagina, total, total_paginas: Math.max(1, Math.ceil(total / porPagina)) },
    });
  } catch (err) {
    next(err);
  }
};

export const cambiarEstadoUsuario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    const resultado = await cambiarEstadoUsuarioAdmin({
      id,
      estado,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!resultado.ok) {
      return errorResponse(res, resultado.mensaje, resultado.status);
    }

    return successResponse(res, resultado.mensaje, resultado.data);
  } catch (err) {
    next(err);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const resultado = await eliminarUsuarioAdmin({
      id,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!resultado.ok) {
      return errorResponse(res, resultado.mensaje, resultado.status);
    }

    return successResponse(res, resultado.mensaje, resultado.data);
  } catch (err) {
    next(err);
  }
};
