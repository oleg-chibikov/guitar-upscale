export const getTitle = (purchaseOption: DigitalGoodsProductDetails) =>
  purchaseOption.title.substring(0, purchaseOption.title.indexOf(" ("));

export const getBillingPeriod = (
  purchaseOption: DigitalGoodsProductDetails
) => {
  switch (purchaseOption.subscriptionPeriod) {
    case "P1W":
      return "weekly";
    case "P1M":
      return "monthly";
    case "P3M":
      return "quarterly";
    case "P6M":
      return "half-yearly";
    case "P1Y":
      return "yearly";
    default:
      return purchaseOption.subscriptionPeriod;
  }
};
