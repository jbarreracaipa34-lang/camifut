// @ts-nocheck
import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "camifut",
});

// Comprobar la conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error de conexión a PostgreSQL (BD: camifut):", err.message);
  } else {
    console.log("✅ Conexión establecida exitosamente a PostgreSQL (BD: camifut)");
    release();
  }
});

export const Conexion = pool;
