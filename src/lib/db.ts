import pg from 'pg';

const { Pool } = pg;

// Récupération de l'URL Neon depuis .env ou process.env
const connectionString = 
  import.meta.env.DATABASE_URL || 
  (typeof process !== 'undefined' && process.env ? process.env.DATABASE_URL : '');

if (!connectionString) {
  console.error("⚠️ La variable DATABASE_URL est introuvable dans le fichier .env !");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Requis pour la connexion sécurisée SSL avec Neon
  },
});

export default pool;