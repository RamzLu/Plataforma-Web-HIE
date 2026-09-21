-- ============================================================
-- migracion: Servicio ↔ Area
--  2026-09-20
-- ============================================================

-- creo tabla intermedia
CREATE TABLE "servicio_area" (
    "servicioId" BIGINT NOT NULL,
    "areaId" BIGINT NOT NULL,

    CONSTRAINT "servicio_area_pkey"
        PRIMARY KEY ("servicioId", "areaId")
);

-- copio relaciones existentes
INSERT INTO "servicio_area" ("servicioId", "areaId")
SELECT "id", "areaId"
FROM "servicio";

-- creo los indices
    CREATE INDEX "servicio_area_areaId_idx"
    ON "servicio_area" ("areaId");

-- creo las cf
ALTER TABLE "servicio_area"
ADD CONSTRAINT "servicio_area_servicioId_fkey"
FOREIGN KEY ("servicioId")
REFERENCES "servicio"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "servicio_area"
ADD CONSTRAINT "servicio_area_areaId_fkey"
FOREIGN KEY ("areaId")
REFERENCES "area"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- elimini la relacion anterior
ALTER TABLE "servicio"
DROP CONSTRAINT IF EXISTS "servicio_areaId_fkey";

-- elimino el indice anterior
DROP INDEX IF EXISTS "servicio_areaId_idx";

-- elimino tmbn el campo anterior
ALTER TABLE "servicio"
DROP COLUMN "areaId";

-- preservo los datos y despues elimino lo viejo  