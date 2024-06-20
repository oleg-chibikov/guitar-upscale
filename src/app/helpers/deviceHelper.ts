const userAgent = navigator.userAgent.toLowerCase();
const mobileKeywords = [
  "iphone",
  "ipod",
  "android",
  "blackberry",
  "windows phone",
  "nokia",
  "opera mini",
  "mobile",
];

// Check if any mobile keyword is present in the user agent
export const isMobileDeviceValue = mobileKeywords.some((keyword) =>
  userAgent.includes(keyword)
);
