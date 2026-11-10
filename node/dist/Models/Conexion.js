"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conexion = exports.pool = void 0;
// @ts-nocheck
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "camifut",
});
// Comprobar la conexión inicial
exports.pool.connect((err, client, release) => {
    if (err) {
        console.error("❌ Error de conexión a PostgreSQL (BD: camifut):", err.message);
    }
    else {
        console.log("✅ Conexión establecida exitosamente a PostgreSQL (BD: camifut)");
        release();
    }
});
exports.Conexion = exports.pool;
