export let map;
export let mapIsReady = false;

export function initMap() {
  map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [5, 20],
    zoom: 0.3,
  });

  // Disable all interactions
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragRotate.disable();
  map.dragPan.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();

  map.on("load", () => {
    // Hide all default layers
    const allLayers = map.getStyle().layers;
    allLayers.forEach((layer) => {
      map.setLayoutProperty(layer.id, "visibility", "none");
    });

    map.addSource("countries", {
      type: "geojson",
      data: "data/world.geo.json",
    });

    map.addSource("country-label-points", {
      type: "geojson",
      data: "data/country-labels-expanded.geojson",
    });

    // layer: countries-fill
    map.addLayer({
      id: "countries-fill",
      type: "fill",
      source: "countries",
      paint: {
        "fill-color": "#eeeeee",
        "fill-opacity": 1,
      },
    });

    // layer: countries-outline
    map.addLayer({
      id: "countries-outline",
      type: "line",
      source: "countries",
      paint: {
        "line-color": "#aaa",
        "line-width": 0.5,
      },
    });

    // layer: highlighted-countries
    map.addLayer({
      id: "highlighted-countries",
      type: "fill",
      source: "countries",
      paint: {
        "fill-color": "#000",
        "fill-opacity": 0,
      },
      "fill-opacity-transition": {
        duration: 800,
        delay: 0,
      },
      layout: {
        visibility: "visible",
      },
      filter: ["in", "admin"],
    });

    // layer: country-labels
    map.addLayer({
      id: "country-labels",
      type: "symbol",
      source: "country-label-points",
      layout: {
        "text-field": ["get", "admin"],
        "text-size": 12,
        "text-anchor": "center",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#333",
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
      filter: ["in", "admin", ""], // initially show nothing
    });

    // layer: hovered-country
    map.addLayer({
      id: "hovered-country",
      type: "fill",
      source: "countries",
      paint: {
        "fill-color": "#69040e",
        "fill-opacity": 0.9,
      },
      filter: ["in", "admin", ""], // no country shown on load
    });

    // layer: hovered-country-label
    map.addLayer({
      id: "hovered-country-label",
      type: "symbol",
      source: "country-label-points",
      layout: {
        "text-field": ["get", "admin"],
        "text-size": 13,
        "text-anchor": "center",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-optional": true,
        "symbol-z-order": "viewport-y", // <- important
      },
      paint: {
        "text-color": "#333", // or "#333" to match others
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
      filter: ["in", "admin", ""], // only show label when hovering
    });

    // Add hover interactivity between map and chart
    map.on("mousemove", "highlighted-countries", (e) => {
      const countryName = e.features[0].properties.admin;
      highlightCountryByName(countryName);
      // updateCountryLabelFilter([countryName]);

      if (window.newThreatChart && window.newThreatChart.series?.[0]) {
        const matchedPoint = window.newThreatChart.series[0].data.find(
          (point) => point.name === countryName
        );
        Highcharts.setOptions({
          plotOptions: { series: { animation: false } },
        });

        if (matchedPoint) {
          window.newThreatChart.series[0].data.forEach((p) =>
            p.update({ color: "#f28e2b" }, false)
          );
          console.log("Matched point:", matchedPoint);
          matchedPoint.update({ color: "#69040e" }, false);
          window.newThreatChart.tooltip.refresh(matchedPoint); // 🧠 NEW: show tooltip!
          window.newThreatChart.redraw();
        }
      }
    });

    map.on("mouseleave", "highlighted-countries", () => {
      clearHighlightedCountry();
      // updateCountryLabelFilter([]);

      if (window.newThreatChart) {
        window.newThreatChart.series[0].data.forEach((p) =>
          p.update({ color: "#f28e2b" }, false)
        );
        window.newThreatChart.redraw();
      }
    });

    // Access the raw features once loaded
    fetch("data/world.geo.json")
      .then((res) => res.json())
      .then((geojson) => {
        const countryNames = geojson.features.map(
          (feature) => feature.properties.admin
        );
        console.log("All country names:", countryNames);
      });
    mapIsReady = true; // Set the map as ready
  });
}

export function highlightCountriesByName(countryList) {
  if (!map.getLayer("highlighted-countries")) return;

  // Always set opacity to 0 before filter change (triggers animation on re-entry)
  map.setPaintProperty("highlighted-countries", "fill-opacity", 0);

  // Apply filter right away
  map.setFilter("highlighted-countries", ["in", "admin", ...countryList]);

  // Wait ~50ms, then fade in
  if (countryList.length > 0) {
    setTimeout(() => {
      map.setPaintProperty("highlighted-countries", "fill-opacity", 0.8);
    }, 50);
  }
}

export function highlightCountryByName(countryName) {
  if (!map.getLayer("hovered-country")) return;
  map.setFilter("hovered-country", ["in", "admin", countryName]);

  if (map.getLayer("hovered-country-label")) {
    map.setFilter("hovered-country-label", ["in", "admin", countryName]);
  }
}

export function clearHighlightedCountry() {
  if (map.getLayer("hovered-country")) {
    map.setFilter("hovered-country", ["in", "admin", ""]);
  }
  if (map.getLayer("hovered-country-label")) {
    map.setFilter("hovered-country-label", ["in", "admin", ""]);
  }
}

export function fadeOutCountries() {
  if (!map.getLayer("highlighted-countries")) return;
  map.setPaintProperty("highlighted-countries", "fill-opacity", 0);
}

export function setCountryFillColor(hexColor) {
  if (!map.getLayer("highlighted-countries")) return;
  map.setPaintProperty("highlighted-countries", "fill-color", hexColor);
}

export function updateCountryLabelFilter(countryList) {
  if (!map || !map.getStyle || !map.getStyle().layers) return;

  const hasLayer = map.getLayer("country-labels");
  if (!hasLayer) return;

  const filter = ["in", "admin", ...countryList];
  map.setFilter("country-labels", filter);
}

export function setPersistentLabels(countryList) {
  if (!map.getLayer("country-labels")) return;
  map.setFilter("country-labels", ["in", "admin", ...countryList]);
}
