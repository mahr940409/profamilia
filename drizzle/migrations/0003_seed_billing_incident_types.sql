-- Add the billing-related incident catalog provided by the operations team.
-- The NOT EXISTS guard keeps this migration safe to run more than once.
INSERT INTO public.incident_types(name)
SELECT name
FROM (VALUES
  ('Error en régimen.'),
  ('Error en cuota moderadora.'),
  ('Error en EPS.'),
  ('Error en número de autorización.'),
  ('Error en contrato por evento o paquete.'),
  ('Error en soportes cargados.'),
  ('Falta de cargue de soportes.'),
  ('Cierre incorrecto de facturas en Terapia NO.'),
  ('Errores en facturación de diversificación.'),
  ('Soportes incompletos para radicación ante las EPS.'),
  ('Soportes cargados en el bot sin la factura correspondiente.')
) AS incoming(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.incident_types existing
  WHERE existing.name = incoming.name
);
