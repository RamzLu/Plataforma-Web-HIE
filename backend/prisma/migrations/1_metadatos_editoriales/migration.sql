-- AlterTable
ALTER TABLE "documento" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "especialidad" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "noticia" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "profesional" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "servicio" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "capacitacion" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;

-- AlterTable
ALTER TABLE "residencia" ADD COLUMN     "editorMeta" JSONB,
ADD COLUMN     "pendingMeta" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "solicitudEliminacion" JSONB;


-- ---------------------------------------------------------------------------
-- Copia de los metadatos que estaban en "configuracion" (clave = <prefijo><id>)
-- a las columnas nuevas, y borrado de esas filas.
-- ---------------------------------------------------------------------------
CREATE FUNCTION pg_temp.a_jsonb(texto TEXT) RETURNS JSONB AS $$
BEGIN
  RETURN texto::jsonb;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

UPDATE "noticia" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^noticia_rejection_[0-9]+$' AND r."id" = substring(c."clave" FROM 19)::bigint;

UPDATE "noticia" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^noticia_pending_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 22)::bigint;

UPDATE "documento" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^documento_rejection_[0-9]+$' AND r."id" = substring(c."clave" FROM 21)::bigint;

UPDATE "documento" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^documento_pending_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 24)::bigint;

UPDATE "profesional" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^profesional_rejection_[0-9]+$' AND r."id" = substring(c."clave" FROM 23)::bigint;

UPDATE "profesional" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^profesional_pending_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 26)::bigint;

UPDATE "profesional" AS r SET "editorMeta" = COALESCE(pg_temp.a_jsonb(c."valor"), jsonb_build_object('editor', c."valor", 'updatedAt', c."updatedAt"))
FROM "configuracion" AS c
WHERE c."clave" ~ '^profesional_editor_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 25)::bigint;

UPDATE "especialidad" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_rejection_esp_[0-9]+$' AND r."id" = substring(c."clave" FROM 28)::bigint;

UPDATE "especialidad" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_pending_meta_esp_[0-9]+$' AND r."id" = substring(c."clave" FROM 31)::bigint;

UPDATE "especialidad" AS r SET "editorMeta" = COALESCE(pg_temp.a_jsonb(c."valor"), jsonb_build_object('editor', c."valor", 'updatedAt', c."updatedAt"))
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_editor_meta_esp_[0-9]+$' AND r."id" = substring(c."clave" FROM 30)::bigint;

UPDATE "servicio" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_rejection_srv_[0-9]+$' AND r."id" = substring(c."clave" FROM 28)::bigint;

UPDATE "servicio" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_pending_meta_srv_[0-9]+$' AND r."id" = substring(c."clave" FROM 31)::bigint;

UPDATE "servicio" AS r SET "editorMeta" = COALESCE(pg_temp.a_jsonb(c."valor"), jsonb_build_object('editor', c."valor", 'updatedAt', c."updatedAt"))
FROM "configuracion" AS c
WHERE c."clave" ~ '^especialidad_editor_meta_srv_[0-9]+$' AND r."id" = substring(c."clave" FROM 30)::bigint;

UPDATE "residencia" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^residencia_rejection_reason_[0-9]+$' AND r."id" = substring(c."clave" FROM 29)::bigint;

UPDATE "residencia" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^residencia_pending_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 25)::bigint;

UPDATE "residencia" AS r SET "editorMeta" = COALESCE(pg_temp.a_jsonb(c."valor"), jsonb_build_object('editor', c."valor", 'updatedAt', c."updatedAt"))
FROM "configuracion" AS c
WHERE c."clave" ~ '^residencia_editor_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 24)::bigint;

UPDATE "capacitacion" AS r SET "rejectionReason" = c."valor"
FROM "configuracion" AS c
WHERE c."clave" ~ '^capacitacion_rejection_reason_[0-9]+$' AND r."id" = substring(c."clave" FROM 31)::bigint;

UPDATE "capacitacion" AS r SET "pendingMeta" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^capacitacion_pending_meta_[0-9]+$' AND r."id" = substring(c."clave" FROM 27)::bigint;

UPDATE "noticia" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_noticia_[0-9]+$' AND r."id" = substring(c."clave" FROM 21)::bigint;

UPDATE "documento" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_documento_[0-9]+$' AND r."id" = substring(c."clave" FROM 23)::bigint;

UPDATE "profesional" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_profesional_[0-9]+$' AND r."id" = substring(c."clave" FROM 25)::bigint;

UPDATE "especialidad" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_especialidad_[0-9]+$' AND r."id" = substring(c."clave" FROM 26)::bigint;

UPDATE "servicio" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_servicio_[0-9]+$' AND r."id" = substring(c."clave" FROM 22)::bigint;

UPDATE "residencia" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_residencia_[0-9]+$' AND r."id" = substring(c."clave" FROM 24)::bigint;

UPDATE "capacitacion" AS r SET "solicitudEliminacion" = pg_temp.a_jsonb(c."valor")
FROM "configuracion" AS c
WHERE c."clave" ~ '^eliminacion_capacitacion_[0-9]+$' AND r."id" = substring(c."clave" FROM 26)::bigint;

DELETE FROM "configuracion" WHERE "clave" ~ '^noticia_rejection_[0-9]+$'
   OR "clave" ~ '^noticia_pending_meta_[0-9]+$'
   OR "clave" ~ '^documento_rejection_[0-9]+$'
   OR "clave" ~ '^documento_pending_meta_[0-9]+$'
   OR "clave" ~ '^profesional_rejection_[0-9]+$'
   OR "clave" ~ '^profesional_pending_meta_[0-9]+$'
   OR "clave" ~ '^profesional_editor_meta_[0-9]+$'
   OR "clave" ~ '^especialidad_rejection_esp_[0-9]+$'
   OR "clave" ~ '^especialidad_pending_meta_esp_[0-9]+$'
   OR "clave" ~ '^especialidad_editor_meta_esp_[0-9]+$'
   OR "clave" ~ '^especialidad_rejection_srv_[0-9]+$'
   OR "clave" ~ '^especialidad_pending_meta_srv_[0-9]+$'
   OR "clave" ~ '^especialidad_editor_meta_srv_[0-9]+$'
   OR "clave" ~ '^residencia_rejection_reason_[0-9]+$'
   OR "clave" ~ '^residencia_pending_meta_[0-9]+$'
   OR "clave" ~ '^residencia_editor_meta_[0-9]+$'
   OR "clave" ~ '^capacitacion_rejection_reason_[0-9]+$'
   OR "clave" ~ '^capacitacion_pending_meta_[0-9]+$'
   OR "clave" ~ '^eliminacion_noticia_[0-9]+$'
   OR "clave" ~ '^eliminacion_documento_[0-9]+$'
   OR "clave" ~ '^eliminacion_profesional_[0-9]+$'
   OR "clave" ~ '^eliminacion_especialidad_[0-9]+$'
   OR "clave" ~ '^eliminacion_servicio_[0-9]+$'
   OR "clave" ~ '^eliminacion_residencia_[0-9]+$'
   OR "clave" ~ '^eliminacion_capacitacion_[0-9]+$';
