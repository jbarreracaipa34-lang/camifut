"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeloCamisetaRouter = void 0;
const express_1 = require("express");
const ModeloCamisetaController_1 = require("../Controller/ModeloCamisetaController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const ModeloCamisetaRouter = (0, express_1.Router)();
exports.ModeloCamisetaRouter = ModeloCamisetaRouter;
// Rutas públicas de consulta del catálogo
ModeloCamisetaRouter.get("/", ModeloCamisetaController_1.getModelosCamiseta);
ModeloCamisetaRouter.get("/:id", ModeloCamisetaController_1.getModeloCamisetaPorId);
// Rutas protegidas exclusivas de Administradores
ModeloCamisetaRouter.post("/", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, ModeloCamisetaController_1.postModeloCamiseta);
ModeloCamisetaRouter.put("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, ModeloCamisetaController_1.putModeloCamiseta);
ModeloCamisetaRouter.delete("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, ModeloCamisetaController_1.deleteModeloCamiseta);
