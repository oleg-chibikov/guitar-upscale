export const removeParamsFromQuery = () => {
  const newUrl = window.location.pathname;
  window.history.replaceState(null, "", newUrl); // Change the URL without reloading
};
