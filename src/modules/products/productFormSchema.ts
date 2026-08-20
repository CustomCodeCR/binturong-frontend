import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/**
 * Producto: SKU y código de barras son códigos (sin espacios), nombre y
 * descripción deben ser texto real, y precio/costo números no negativos.
 */
export function buildProductSchema(
  rules: Rules,
  t: Translator,
): ValidationSchema {
  const skuLabel = t("products.fields.sku");
  const barcodeLabel = t("products.fields.barcode");
  const nameLabel = t("products.fields.name");
  const descriptionLabel = t("products.fields.description");
  const categoryLabel = t("products.fields.category");
  const uomLabel = t("products.fields.uom");
  const taxLabel = t("products.fields.tax");
  const basePriceLabel = t("products.fields.basePrice");
  const averageCostLabel = t("products.fields.averageCost");

  return {
    sku: [rules.required(skuLabel), rules.code(skuLabel, 3, 30)],
    barcode: [rules.required(barcodeLabel), rules.code(barcodeLabel, 6, 30)],
    name: [
      rules.required(nameLabel),
      rules.meaningfulText(nameLabel, 3),
      rules.maxLength(120, nameLabel),
    ],
    description: [
      rules.required(descriptionLabel),
      rules.meaningfulText(descriptionLabel, 5),
      rules.maxLength(500, descriptionLabel),
    ],
    categoryId: [rules.required(categoryLabel)],
    uomId: [rules.required(uomLabel)],
    taxId: [rules.required(taxLabel)],
    basePrice: [rules.required(basePriceLabel), rules.min(0, basePriceLabel)],
    averageCost: [
      rules.required(averageCostLabel),
      rules.min(0, averageCostLabel),
    ],
  };
}
