export const getTitle = (subscriptionOption: DigitalGoodsProductDetails) =>
  subscriptionOption.title.substring(0, subscriptionOption.title.indexOf(" ("));

export const getBillingPeriod = (
  subscriptionOption: DigitalGoodsProductDetails
) => {
  switch (subscriptionOption.subscriptionPeriod) {
    case "P1W":
      return "weekly";
    case "P1M ":
      return "monthly";
    case "P3M":
      return "quarterly";
    case "P6M":
      return "half-yearly";
    case "P1Y":
      return "yearly";
    default:
      return subscriptionOption.subscriptionPeriod;
  }
};
