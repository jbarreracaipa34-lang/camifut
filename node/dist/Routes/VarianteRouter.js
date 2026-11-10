"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarianteRouter = void 0;
const express_1 = require("express");
const VarianteController_1 = require("../Controller/VarianteController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const VarianteRouter = (0, express_1.Router)();
exports.VarianteRouter = VarianteRouter;
VarianteRouter.get("/publicacion/:publicacionId", VarianteController_1.getVariantesPorPublicacion);
// Requiere autenticacion de vendedor para crear/editar/eliminar variantes
VarianteRouter.post("/", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, VarianteController_1.postVariante);
VarianteRouter.put("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, VarianteController_1.putVariante);
VarianteRouter.delete("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, VarianteController_1.deleteVariante);
