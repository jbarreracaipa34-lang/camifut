"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Importar rutas de Camifut
const AuthRouter_1 = require("./Routes/AuthRouter");
const UsuarioRouter_1 = require("./Routes/UsuarioRouter");
const EquipoRouter_1 = require("./Routes/EquipoRouter");
const ModeloCamisetaRouter_1 = require("./Routes/ModeloCamisetaRouter");
const PublicacionRouter_1 = require("./Routes/PublicacionRouter");
const VarianteRouter_1 = require("./Routes/VarianteRouter");
const CarritoRouter_1 = require("./Routes/CarritoRouter");
const PedidoRouter_1 = require("./Routes/PedidoRouter");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configurar Rutas de la API de Camifut
app.use("/api/auth", AuthRouter_1.AuthRouter);
app.use("/api/usuarios", UsuarioRouter_1.UsuarioRouter);
app.use("/api/equipos", EquipoRouter_1.EquipoRouter);
app.use("/api/modelos-camiseta", ModeloCamisetaRouter_1.ModeloCamisetaRouter);
app.use("/api/publicaciones", PublicacionRouter_1.PublicacionRouter);
app.use("/api/variantes", VarianteRouter_1.VarianteRouter);
app.use("/api/carrito", CarritoRouter_1.CarritoRouter);
app.use("/api/pedidos", PedidoRouter_1.PedidoRouter);
// Endpoint de verificación del estado del servidor
app.get("/", (req, res) => {
    res.json({
        app: "Camifut API - Backend Marketplace de Camisetas de Fútbol",
        estado: "Online",
        motor_bd: "PostgreSQL 13+",
        bd: "camifut",
        rutas_disponibles: [
            "/api/auth",
            "/api/usuarios",
            "/api/equipos",
            "/api/modelos-camiseta",
            "/api/publicaciones",
            "/api/variantes",
            "/api/carrito",
            "/api/pedidos",
        ],
    });
});
app.listen(port, () => {
    console.log(`🚀 Servidor Camifut corriendo en http://localhost:${port}`);
});
