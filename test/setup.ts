// Test bootstrap. Loads .env.local (then .env) so the DB integration tests can
// reach a local Postgres via DATABASE_URL. dotenv never overrides variables that
// are already set, so CI (which exports DATABASE_URL directly) wins. The pure
// unit tests need none of this — they just ignore it.
import { config } from "dotenv";

config({ path: ".env.local" });
config();
