export let newThreatChart;
window.newThreatChart = null; // so map.js can find it

const geoJsonNameMap = {
  Serbia: "Republic of Serbia",
};

d3.csv(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0dXdJcf-5gotVvOj10YMRPPnvnloJfmVsuZSQEKlt_Y13p28L7QKKb9G3tr-nF2PSTr87rIB2CLfx/pub?gid=0&single=true&output=csv"
).then((data) => {
  const targetCountries = [
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
    "Serbia",
    "Laos",
    "Myanmar",
    "Brunei",
    "Bosnia and Herzegovina",
    "Moldova",
  ];
  // const chartData = data
  //   .filter((d) => targetCountries.includes(d.Name.trim()))
  //   .map((d) => ({
  //     name: d.Name.trim(),
  //     y: Number(d["New Threat"]) || 0, // Tariff Rate (used by default)
  //     imports: Number(d["2024 Imports"]) || 0,
  //   }));

  const chartData = data
    .filter((d) => targetCountries.includes(d.Name.trim()))
    .map((d) => ({
      name: d.Name.trim(),
      percentage: Number(d["Percent of US Imports"]) || 0,
      tariff: Number(d["New Threat"]) || 0,
      imports: Number(d["2024 Imports"]) || 0,
    }));

  const initialData = chartData
    .map((d) => ({
      name: d.name,
      y: d.tariff,
      tariff: d.tariff,
      imports: d.imports,
      percentage: d.percentage,
    }))
    .sort((a, b) => b.y - a.y);

  // console.log("Chart Data:", chartData);
  newThreatChart = Highcharts.chart("new-threats-chart", {
    chart: { type: "column", animation: false },
    title: { text: null },
    legend: { enabled: false },
    credits: { enabled: false },
    plotOptions: {
      column: {
        borderRadius: 0,
      },
      series: {
        name: "Tariff",
        data: initialData,
        enableMouseTracking: true,
        states: {
          inactive: {
            enabled: false,
          },
        },
        point: {
          events: {
            mouseOver: function () {
              const chart = this.series.chart;
              const countryName = geoJsonNameMap[this.name] || this.name;

              // Reset all bar colors
              // inside mouseOver
              chart.series[0].points.forEach((p) => {
                p.update(
                  {
                    color: "#f28e2b",
                  },
                  false
                );
              });

              // Highlight this bar
              this.update({ color: "#69040e" }, false);

              // Highlight on map
              if (window.mapUtils) {
                mapUtils.highlightCountryByName(countryName);
              }

              chart.redraw();
            },
            mouseOut: function () {
              const chart = this.series.chart;

              // Reset bar colors
              chart.series[0].points.forEach((p) => {
                p.update(
                  {
                    color: "#f28e2b",
                  },
                  false
                );
              });

              // Clear only hovered label
              if (window.mapUtils) {
                mapUtils.clearHighlightedCountry();
              }

              chart.redraw();
            },
          },
        },
      },
    },

    xAxis: {
      type: null,
      title: { text: "Country (sorted by tariff rate)" },
      labels: { enabled: false },
      tickLength: 0,
      lineColor: "#eee",
    },
    yAxis: {
      max: 50,
      title: { text: "Tariff Rate (%)" },
      gridLineColor: "#eee",
    },
    series: [
      {
        name: "Tariff",
        data: initialData,
        color: "#ffa131",
        emableMouseTracking: true,
        states: {
          hover: {
            color: "#69040e",
          },
          select: {
            color: "#69040e",
            borderColor: "#69040e",
            borderWidth: 3,
          },
        },
      },
    ],
    tooltip: {
      backgroundColor: "#fff",
      borderRadius: 0,
      borderWidth: 0,
      style: {
        color: "#000",
        fontWeight: "normal",
        fontFamily: "inherit",
      },
      formatter: function () {
        // console.log(this.imports);
        let importValue = this.point.imports || 0;
        let importDisplay;

        if (importValue >= 1) {
          importDisplay = `${importValue.toFixed(2)}B`;
        } else if (importValue >= 0.001) {
          importDisplay = `${(importValue * 1000).toFixed(1)}M`;
        } else {
          importDisplay = `${(importValue * 1000000).toFixed(1)}K`;
        }

        return `
          <span style="font-size: 20px; font-weight: bold; font-family: 'Libre Franklin';">${this.key}</span><br/>
          <span style="font-size: 16px; font-family: 'Libre Franklin'; font-weight: 700;">Threatened tariff rate: <span style="font-weight: 400;">${this.y}%</span></span><br/>
          <span style="font-size: 16px; font-family: 'Libre Franklin'; font-weight: 700;">2024 Imports</span><br/>
          <ul style="padding-left: 25px; margin: 0; font-size: 16px; font-family: 'Libre Franklin';">
            <li>$${importDisplay}</li>
            <li>${this.percentage}%</li>
          </ul>
        `;
      },
      useHTML: true,
    },
  });

  window.newThreatChart = newThreatChart;
  const tariffBtn = document.getElementById("sort-tariff");
  const importsBtn = document.getElementById("sort-imports");
  const percentBtn = document.getElementById("new-threat-percent");

  percentBtn.addEventListener("click", () => {
    const sorted = [...chartData]
      .sort((a, b) => b.percentage - a.percentage)
      .map((d) => ({
        name: d.name,
        y: d.percentage,
        tariff: d.tariff,
        imports: d.imports,
        percentage: d.percentage,
      }));

    newThreatChart.series[0].setData(sorted);
    newThreatChart.series[0].update({ name: "% of US Imports" });
    newThreatChart.yAxis[0].setTitle({ text: "% of U.S. Imports" });
    newThreatChart.yAxis[0].update({
      max: null,
      title: { text: "% of 2024 US Imports" },
    });
    newThreatChart.xAxis[0].setTitle({
      text: "Country (sorted by % of US Imports)",
    });
    // Update active classes
    percentBtn.classList.add("active");
    tariffBtn.classList.remove("active");
    importsBtn.classList.remove("active");
  });

  tariffBtn.addEventListener("click", () => {
    // Sort logic
    const sorted = [...chartData]
      .sort((a, b) => b.tariff - a.tariff)
      .map((d) => ({
        name: d.name,
        y: d.tariff,
        tariff: d.tariff,
        imports: d.imports,
        percentage: d.percentage,
      }));

    newThreatChart.series[0].setData(sorted);
    newThreatChart.xAxis[0].setTitle({
      text: "Country (sorted by tariff rate)",
    });
    newThreatChart.yAxis[0].setTitle({ text: "Tariff Rate (%)" });

    // Update active class
    tariffBtn.classList.add("active");
    importsBtn.classList.remove("active");
    percentBtn.classList.remove("active");
  });

  importsBtn.addEventListener("click", () => {
    // Sort logic
    const sorted = [...chartData]
      .sort((a, b) => b.imports - a.imports)
      .map((d) => ({
        name: d.name,
        y: d.tariff,
        tariff: d.tariff,
        imports: d.imports,
        percentage: d.percentage,
      }));

    newThreatChart.series[0].setData(sorted);
    newThreatChart.xAxis[0].setTitle({
      text: "Country (sorted by import value)",
    });
    newThreatChart.yAxis[0].setTitle({ text: "Tariff Rate (%)" });

    // Update active class
    importsBtn.classList.add("active");
    tariffBtn.classList.remove("active");
    percentBtn.classList.remove("active");
  });
});
