import * as mapUtils from "./map.js";

// Make map functions globally available
window.mapUtils = mapUtils;

var stepOneCountries = [
  "Mexico",
  "Canada",
  "South Korea",
  "Thailand",
  "Malaysia",
  "Brazil",
  "South Africa",
  "Cambodia",
  "Bangladesh",
  "Iraq",
  "Sri Lanka",
  "Algeria",
  "Kazakhstan",
  "Libya",
  "Tunisia",
  "Republic of Serbia",
  "Laos",
  "Myanmar",
  "Brunei",
  "Bosnia and Herzegovina",
  "Moldova",
];

var stepOneLabels = [
  "Canada",
  "Mexico",
  "Brazil",
  "Algeria",
  "Libya",
  "South Africa",
  "South Korea",
  "Thailand",
  "Iraq",
  "Kazakhstan",
];

function init() {
  mapUtils.initMap();

  // Delay step logic until map has finished loading
  const interval = setInterval(() => {
    if (mapUtils.mapIsReady) {
      clearInterval(interval);
      mapUtils.highlightCountriesByName(stepOneCountries);
      mapUtils.setCountryFillColor("#ffa131"); // set fill color for highlighted countries
      mapUtils.setPersistentLabels(stepOneLabels);
    }
  }, 100);
}

// kick things off
init();
