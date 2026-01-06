async function getAvgDailySales(productId) {
  // mock logic
  return Math.random() * 2 + 1;
}

function getThreshold(productType) {
  if (productType === "fast-moving") return 20;
  return 10;
}

module.exports = { getAvgDailySales, getThreshold };
