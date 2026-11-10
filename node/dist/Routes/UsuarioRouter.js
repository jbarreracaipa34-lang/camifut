"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioRouter = void 0;
const express_1 = require("express");
const UsuarioController_1 = require("../Controller/UsuarioController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const UsuarioRouter = (0, express_1.Router)();
exports.UsuarioRouter = UsuarioRouter;
// Consulta protegida para staff
UsuarioRouter.get("/", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, UsuarioController_1.getUsuarios);
UsuarioRouter.get("/:id", AuthMiddleware_1.verificarAutenticacion, UsuarioController_1.getUsuarioPorId);
// Creación de usuario (público o administrado)
UsuarioRouter.post("/", UsuarioController_1.postUsuario);
// Modificación de usuario: autenticado (propio perfil o admin subordinado)
UsuarioRouter.put("/:id", AuthMiddleware_1.verificarAutenticacion, UsuarioController_1.putUsuario);
// Baja o eliminación de usuario: protegido según jerarquía (Superadmin o Admin sobre subordinados)
UsuarioRouter.delete("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, UsuarioController_1.deleteUsuario);
