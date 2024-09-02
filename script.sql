-- GET Categories
SELECT
  pc.id AS id,
  pc.name AS name
FROM
  ProductCategories pc
ORDER BY
  name ASC;

-- GET Products
SELECT
  p.name AS name,
  pc.id AS categoryId,
  CASE
    WHEN p.quantityType = 'KG' THEN 1
    WHEN p.quantityType LIKE 'Box%' THEN 2
    WHEN p.quantityType = 'Pcs' THEN 3
    WHEN p.quantityType = 'Bottle' THEN 4
    ELSE 0
  END AS unitId
from
  Products p
  INNER JOIN ProductCategories pc ON p.categoryId = pc.id
ORDER BY
  p.name ASC,
  pc.name ASC;