export const buildDigitalGoodsService = async () => {
  const getDigitalGoodsService = window.getDigitalGoodsService;
  return await getDigitalGoodsService("https://play.google.com/billing");
};
