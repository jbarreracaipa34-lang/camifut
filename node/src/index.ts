import express, { Request, Response } from "express";
import cors from "cors";

// Importar rutas de Camifut
import { AuthRouter } from "./Routes/AuthRouter";
import { UsuarioRouter } from "./Routes/UsuarioRouter";
import { EquipoRouter } from "./Routes/EquipoRouter";
import { ModeloCamisetaRouter } from "./Routes/ModeloCamisetaRouter";
import { PublicacionRouter } from "./Routes/PublicacionRouter";
import { VarianteRouter } from "./Routes/VarianteRouter";
import { CarritoRouter } from "./Routes/CarritoRouter";
import { PedidoRouter } from "./Routes/PedidoRouter";

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar Rutas de la API de Camifut
app.use("/api/auth", AuthRouter);
app.use("/api/usuarios", UsuarioRouter);
app.use("/api/equipos", EquipoRouter);
app.use("/api/modelos-camiseta", ModeloCamisetaRouter);
app.use("/api/publicaciones", PublicacionRouter);
app.use("/api/variantes", VarianteRouter);
app.use("/api/carrito", CarritoRouter);
app.use("/api/pedidos", PedidoRouter);

// Endpoint de verificación del estado del servidor
app.get("/", (req: Request, res: Response) => {
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
