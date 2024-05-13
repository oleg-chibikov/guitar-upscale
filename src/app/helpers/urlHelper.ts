// Function to reload the page with a new query string parameter
export const reloadPageWithQueryParam = (
  paramName: string,
  paramValue: string
) => {
  console.log("Reloading page");
  // Get the current URL
  let currentUrl = new URL(window.location.href);

  // Set or update the query string parameter
  currentUrl.searchParams.set(paramName, paramValue);

  // Reload the page with the updated URL
  window.location.href = currentUrl.toString();
};

// Function to check if a query string parameter exists
export const hasQueryParam = (paramName: string) => {
  // Get the current URL
  let currentUrl = new URL(window.location.href);

  // Get the search parameters
  let params = currentUrl.searchParams;

  // Check if the parameter exists
  return params.has(paramName);
};

export const removeParamsFromQuery = () => {
  const newUrl = window.location.pathname;
  window.history.replaceState(null, "", newUrl); // Change the URL without reloading
};
