// Check if any mobile keyword is present in the user agent
export let isMobileDeviceValue = false;

if (typeof window !== "undefined") {
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

  isMobileDeviceValue = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );
}
