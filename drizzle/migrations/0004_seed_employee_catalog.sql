-- Replace the demo employee catalog with the real employee names.
-- Demo rows are deactivated instead of deleted so existing incident history
-- keeps its employee references intact.
UPDATE public.employees
SET active = false
WHERE name IN ('Juan Pérez', 'María Rodríguez', 'Carlos Gómez');

INSERT INTO public.employees(name)
SELECT name
FROM (VALUES
  ('Sandra Correa'),
  ('Edison Ramírez'),
  ('Edinson Ramirez'),
  ('Yileny Cifuentes'),
  ('Julie Higuita'),
  ('Danyela Trujillo'),
  ('Vanessa Lopez'),
  ('Manuela Ruiz'),
  ('Dennys Escobar'),
  ('Angela Orozco'),
  ('Liliana Soret'),
  ('Yuli Caballero'),
  ('Tatiana Pelaez'),
  ('Laura Parra'),
  ('Karoll Natalia Arango'),
  ('Yamilet Giraldo Marín'),
  ('Jonathan Acuesta')
) AS incoming(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.employees existing
  WHERE existing.name = incoming.name
);
