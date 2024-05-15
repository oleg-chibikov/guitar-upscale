export const getTitle = (subscriptionOption: DigitalGoodsProductDetails) =>
  subscriptionOption.title.substring(0, subscriptionOption.title.indexOf(" ("));
