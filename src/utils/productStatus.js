const NEW_PRODUCT_DAYS = 10;

export function getStockValue(stock) {
  if (stock === null || stock === undefined || stock === "") return null;

  const value = Number(stock);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

export function isNewProduct(createdAt) {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;

  const ageInDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
  return ageInDays >= 0 && ageInDays < NEW_PRODUCT_DAYS;
}
