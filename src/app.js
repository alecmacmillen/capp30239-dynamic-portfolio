// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)
// const domReady = require('domready');

var formatPercent = d3.format(".0%");

document.addEventListener('DOMContentLoaded', () => {
  //console.log(document.getElementById("viz2-cycle").value);
  initViz1();
  initViz2();
  plotviz3(1988);

});

// VIZ 1 - multi-line chart
function initViz1() {
  d3.csv("./data/countyline_dem_IMPUTE.csv")
    .then(function (data) {
      let years = ["2002", "2004", "2006", "2008", "2010", "2012", "2014", "2016", "2018"];
      const columns = data.columns.slice(1);
      const plotData = {
        y: "% Democratic vote",
        series: data.map(d => ({
          name: d.County,
          values: columns.map(k => (+d[k]).toFixed(4))
        })),
        dates: years.map(d3.utcParse("%Y"))
      }
      buildLine(plotData);
    });
}

function buildLine(data) {
  const viz1Height = 600;
  const viz1Width = 640;
  const viz1Margin = ({ top: 20, right: 20, bottom: 30, left: 30 });

  const viz1Y = d3.scaleLinear()
    .domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
    .range([viz1Height - viz1Margin.bottom, viz1Margin.top])

  const viz1X = d3.scaleUtc()
    .domain(d3.extent(data.dates))
    .range([viz1Margin.left, viz1Width - viz1Margin.right])

  const viz1YAxis = g => g
    .attr("transform", `translate(${viz1Margin.left},0)`)
    .call(d3.axisLeft(viz1Y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
      .attr("x", 3)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(data.y))

  const viz1XAxis = g => g
    .attr("transform", `translate(0,${viz1Height - viz1Margin.bottom})`)
    .call(d3.axisBottom(viz1X).ticks(viz1Width / 80).tickSizeOuter(0))

  const viz1Line = d3.line()
    .defined(d => !isNaN(d))
    .x((d, i) => viz1X(data.dates[i]))
    .y(d => viz1Y(d));

  const svg = d3.select("#viz1").append("svg")
    .attr("viewBox", [0, 0, viz1Width, viz1Height])
    .style("overflow", "visible")

  svg.append("g")
    .call(viz1XAxis)

  svg.append("g")
    .call(viz1YAxis)

  const path = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(data.series)
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("d", d => viz1Line(d.values));

  function hover(svg, path) {
    if ("ontouchstart" in document) svg
      .style("-webkit-tap-highlight-color", "transparent")
      .on("touchmove", moved)
      .on("touchstart", entered)
      .on("touchend", left)
    else svg
      .on("mousemove", moved)
      .on("mouseenter", entered)
      .on("mouseleave", left);

    const dot = svg.append("g")
      .attr("display", "none");

    dot.append("circle")
      .attr("r", 2.5)

    dot.append("text")
      .style("font", "10px sans-serif")
      .attr("text-anchor", "middle")
      .attr("y", -8);

    function moved() {
      d3.event.preventDefault();
      const ym = viz1Y.invert(d3.event.layerY);
      const xm = viz1X.invert(d3.event.layerX);
      const i1 = d3.bisectLeft(data.dates, xm, 1);
      const i0 = i1 - 1;
      const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
      const s = data.series.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);
      path.attr("stroke", d => d === s ? null : '#ddd').filter(d => d === s).raise();
      dot.attr("transform", `translate(${viz1X(data.dates[i])},${viz1Y(s.values[i])})`);
      dot.select("text").text(s.name);
    }

    function entered() {
      path.style("mix-blend-mode", null).attr("stroke", "#ddd");
      dot.attr("display", null);
    }

    function left() {
      path.style("mix-blend-mode", "multiply").attr("stroke", null);
      dot.attr("display", "none");
    }
  }

  svg.call(hover, path);

  return svg.node();
}



// VIZ 2 - COUNTY SCATTER PLOT
function initViz2() {
  d3.json("./data/county_scatter_animated.json")
    .then(function (data) {
      //console.log(data);
      let year = document.getElementById("viz2-cycle").value;
      let metric = document.getElementById("viz2-metric").value;
      buildScatter(data, year, metric);
    })
}

function buildScatter(data, year, metric) {
  const viz2Margin = ({ top: 20, right: 20, bottom: 35, left: 40 });

  const viz2Height = 640;
  const viz2Width = 800;

  var formatPercent = d3.format(".0%");
  const viz2Color = d3.scaleDiverging()
    .domain([0, .5, 1])
    .interpolator(d3.interpolateRdBu)

  const viz2Radius = d3.scaleSqrt([-3e3, 6e6], [0, viz2Width / 18]);

  const viz2Y = d3.scaleLinear([0, 1], [viz2Height - viz2Margin.bottom, viz2Margin.top]);

  if (metric === "percwhite") {
    var viz2X = d3.scaleLinear([.4, 1], [viz2Margin.left, viz2Width - viz2Margin.right]);
  } else if (metric === "medage") {
    var viz2X = d3.scaleLinear([20, 60], [viz2Margin.left, viz2Width - viz2Margin.right]);
  }

  const viz2YAxis = g => g
    .attr("transform", `translate(${viz2Margin.left},0)`)
    .call(d3.axisLeft(viz2Y).tickFormat(formatPercent))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -viz2Margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ Vote share for Democratic candidate"))

  var viz2XAxis = g => g
    .attr("id", "viz2xAxis")
    .attr("transform", `translate(0,${viz2Height - viz2Margin.bottom})`)
    .call(d3.axisBottom(viz2X).ticks(viz2Width / 80, ",").tickFormat(formatPercent))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", viz2Width)
      .attr("y", viz2Margin.bottom - 4)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text("→ % of county population white"));
 
  const grid = g => g
    .attr("id", "viz2Grid")
    .attr("stroke", "black")
    .attr("stroke-opacity", 0.1)
    .call(g => g.append("g")
      .selectAll("line")
      .data(viz2X.ticks())
      .join("line")
      .attr("x1", d => 0.5 + viz2X(d))
      .attr("x2", d => 0.5 + viz2X(d))
      .attr("y1", viz2Margin.top)
      .attr("y2", viz2Height - viz2Margin.bottom))
    .call(g => g.append("g")
      .selectAll("line")
      .data(viz2Y.ticks())
      .join("line")
      .attr("y1", d => 0.5 + viz2Y(d))
      .attr("y2", d => 0.5 + viz2Y(d))
      .attr("x1", viz2Margin.left)
      .attr("x2", viz2Width - viz2Margin.right));

  const svg = d3.select("#viz2").append("svg")
    .attr("viewBox", [0, 0, viz2Width, viz2Height]);

  var tooltip = d3.select("#viz2")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var tipMouseover = function (d) {
    var html = "<em>County:</em> " + d.name + "<br/>" +
      "<em>CSA:</em> " + d.MSA + "<br/>" +
      "<em>Population:</em> " + d.population.toLocaleString() + "<br/>" +
      "<em>Percent white:</em> " + d.percwhite.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 }) + "<br/>" +
      "<em>Median age:</em> " + d.medage + "<br/>" +
      "<em>Percent Dem vote</em>: " + d.percdem.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
    tooltip.html(html)
      .style("left", (d3.event.pageX - 500) + "px")
      .style("top", d3.event.pageY + "px")
      .transition()
      .duration(200)
      .style("opacity", 1)
  }

  var tipMouseout = function (d) {
    tooltip.transition()
      .duration(200)
      .style("opacity", 0);
  };

  svg.append("g")
    .call(grid);

  svg.append("g")
    .call(viz2XAxis);

  svg.append("g")
    .call(viz2YAxis);

  svg.append("g")
    .attr("stroke", "black")
    .selectAll("circle")
    .data(dataAt(data, year), d => d.name)
    .join("circle")
    .sort((a, b) => d3.descending(a.population, b.population))
    .attr("class", "countyCircle")
    .attr("cx", d => viz2X(d.percwhite))
    .attr("cy", d => viz2Y(d.percdem))
    .attr("r", d => viz2Radius(d.population))
    .attr("fill", d => viz2Color(d.percdem))
    .on("mouseover", tipMouseover)
    .on("mouseout", tipMouseout);
}

function updateViz2() {
  let metric = document.getElementById("viz2-metric").value;
  if (metric === "percwhite") {
    d3.json("./data/county_scatter_animated.json")
      .then(function (data) {
        let year = document.getElementById("viz2-cycle").value;
        document.getElementById("viz2-year").innerHTML = year;
        document.getElementById("viz2-metric-title").innerHTML = "percent of county population white";
        const viz2Margin = ({ top: 20, right: 20, bottom: 35, left: 40 });
        const viz2Height = 640;
        const viz2Width = 800;
        const viz2Color = d3.scaleDiverging()
          .domain([0, .5, 1])
          .interpolator(d3.interpolateRdBu)

        const viz2Radius = d3.scaleSqrt([-3e3, 6e6], [0, viz2Width / 18]);
        const viz2Y = d3.scaleLinear([0, 1], [viz2Height - viz2Margin.bottom, viz2Margin.top]);
        const viz2X = d3.scaleLinear([.4, 1], [viz2Margin.left, viz2Width - viz2Margin.right]);

        var viz2XAxis = g => g
          .attr("id", "viz2xAxis")
          .attr("transform", `translate(0,${viz2Height - viz2Margin.bottom})`)
          .call(d3.axisBottom(viz2X).ticks(viz2Width / 80, ",").tickFormat(formatPercent))
          .call(g => g.select(".domain").remove())
          .call(g => g.append("text")
            .attr("x", viz2Width)
            .attr("y", viz2Margin.bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("→ % of county population white"));

        const grid = g => g
          .attr("id", "viz2Grid")
          .attr("stroke", "black")
          .attr("stroke-opacity", 0.1)
          .call(g => g.append("g")
            .selectAll("line")
            .data(viz2X.ticks())
            .join("line")
            .attr("x1", d => 0.5 + viz2X(d))
            .attr("x2", d => 0.5 + viz2X(d))
            .attr("y1", viz2Margin.top)
            .attr("y2", viz2Height - viz2Margin.bottom))
          .call(g => g.append("g")
            .selectAll("line")
            .data(viz2Y.ticks())
            .join("line")
            .attr("y1", d => 0.5 + viz2Y(d))
            .attr("y2", d => 0.5 + viz2Y(d))
            .attr("x1", viz2Margin.left)
            .attr("x2", viz2Width - viz2Margin.right));

        let svg = d3.select("#viz2").select("svg");

        d3.select("#viz2xAxis").remove();
        d3.select("#viz2Grid").remove();
        svg.insert("g", "g")
          .call(grid);
        svg.append("g")
          .call(viz2XAxis);

        svg.selectAll("circle").data(dataAt(data, year), d => d.name)
          .each(function (d, i) {
            d3.select(this)
              .transition().duration(1000)//.delay(2*i)
              .attr("cx", d => viz2X(d.percwhite))
              .attr("cy", d => viz2Y(d.percdem))
              .attr("r", d => viz2Radius(d.population))
              .attr("fill", d => viz2Color(d.percdem))
          })
      });
  } else if (metric === "medage") {
    d3.json("./data/county_scatter_animated.json")
      .then(function (data) {
        let year = document.getElementById("viz2-cycle").value;
        document.getElementById("viz2-year").innerHTML = year;
        document.getElementById("viz2-metric-title").innerHTML = "county median age";
        const viz2Margin = ({ top: 20, right: 20, bottom: 35, left: 40 });
        const viz2Height = 640;
        const viz2Width = 800;
        const viz2Color = d3.scaleDiverging()
          .domain([0, .5, 1])
          .interpolator(d3.interpolateRdBu)

        const viz2Radius = d3.scaleSqrt([-3e3, 6e6], [0, viz2Width / 18]);
        const viz2Y = d3.scaleLinear([0, 1], [viz2Height - viz2Margin.bottom, viz2Margin.top]);
        const viz2X = d3.scaleLinear([20, 60], [viz2Margin.left, viz2Width - viz2Margin.right]);

        var viz2XAxis = g => g
          .attr("id", "viz2xAxis")
          .attr("transform", `translate(0,${viz2Height - viz2Margin.bottom})`)
          .call(d3.axisBottom(viz2X).ticks(viz2Width / 80, ","))
          .call(g => g.select(".domain").remove())
          .call(g => g.append("text")
            .attr("x", viz2Width)
            .attr("y", viz2Margin.bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("→ county median age"));

        const grid = g => g
          .attr("id", "viz2Grid")
          .attr("stroke", "black")
          .attr("stroke-opacity", 0.1)
          .call(g => g.append("g")
            .selectAll("line")
            .data(viz2X.ticks())
            .join("line")
            .attr("x1", d => 0.5 + viz2X(d))
            .attr("x2", d => 0.5 + viz2X(d))
            .attr("y1", viz2Margin.top)
            .attr("y2", viz2Height - viz2Margin.bottom))
          .call(g => g.append("g")
            .selectAll("line")
            .data(viz2Y.ticks())
            .join("line")
            .attr("y1", d => 0.5 + viz2Y(d))
            .attr("y2", d => 0.5 + viz2Y(d))
            .attr("x1", viz2Margin.left)
            .attr("x2", viz2Width - viz2Margin.right));

        let svg = d3.select("#viz2").select("svg");

        d3.select("#viz2xAxis").remove();
        d3.select("#viz2Grid").remove();
        svg.insert("g", "g")
          .call(grid);
        svg.append("g")
          .call(viz2XAxis);

        svg.selectAll("circle").data(dataAt(data, year), d => d.name)
          .each(function (d, i) {
            d3.select(this)
              .transition().duration(1000)//.delay(2*i)
              .attr("cx", d => viz2X(d.medage))
              .attr("cy", d => viz2Y(d.percdem))
              .attr("r", d => viz2Radius(d.population))
              .attr("fill", d => viz2Color(d.percdem))
          })
      });
  }
}

function valueAt(values, year) {
  let bisectYear = d3.bisector(([year]) => year).left;
  const i = bisectYear(values, year, 0, values.length - 1);
  const a = values[i];
  if (i > 0) {
    const b = values[i - 1];
    const t = (year - a[0]) / (b[0] - a[0]);
    return a[1] * (1 - t) + b[1] * t;
  }
  return a[1];
}

function dataAt(data, year) {
  //console.log(data);
  return data.map(d => ({
    name: d.name,
    MSA: d.MSA,
    population: valueAt(d.population, year),
    percdem: valueAt(d.percdem, year),
    percwhite: valueAt(d.percwhite, year),
    medage: valueAt(d.medage, year)
  }));
}






// VIZ 4 - SEQUENCES SUNBURST
const breadcrumbHeight = 30;
const breadcrumbWidth = 75;
const width = 640;
const radius = width / 2;
const mousearc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(radius);
const arc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .padAngle(1 / radius)
  .padRadius(radius)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1) - 1);
const color = d3.scaleOrdinal()
  .domain(["party", "district", "name", "type"])
  .range(["#ffd700", "#ffb14e", "#fa8775", "#ea5f94", "#cd34b5", "#9d02d7", "#d3d3d3"]);

function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
  // credit to https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
  } catch (e) {
    console.log(e)
  }
};

function breadcrumbPoints(d, i) {
  // Generate a string that describes the points of a breadcrumb SVG polygon
  const tipWidth = 10;
  const points = [];
  points.push("0,0");
  points.push(`${breadcrumbWidth},0`);
  points.push(`${breadcrumbWidth + tipWidth},${breadcrumbHeight / 2}`);
  points.push(`${breadcrumbWidth},${breadcrumbHeight}`);
  points.push(`0,${breadcrumbHeight}`);
  if (i > 0) {
    points.push(`${tipWidth},${breadcrumbHeight / 2}`);
  }
  return points.join(" ");
}

function partition(data) {
  d3.partition().size([2 * Math.PI, radius * radius])(
    d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)
  )
}

function plotviz3(year) {
  d3.csv("../data/sunburst_FINAL.csv")
    .then(function (data) {
      const yearlyDataArray = [];
      // Filter data by the provided year
      data.forEach(function (obj) {
        if (+obj.CAND_ELECTION_YR === year) {
          // Only add district to the sequence for House candidates
          if (obj.CAND_OFFICE === "House") {
            let newArray = [obj.CAND_PTY_AFFILIATION, obj.CAND_OFFICE_DISTRICT,
                            obj.CAND_NAME, obj.CONTRIB_TYPE];
            yearlyDataArray.push(
              [newArray.join("-"), obj.CONTRIB_AMT]
            );
          } 
        }
      });
      const plotData = buildHierarchy(yearlyDataArray);
      buildSunburst(plotData);
    });
}

function buildHierarchy(inputData) {
  // Helper function that transforms data into hierarchical format
  const root = { name: "root", children: [] };
  for (let i = 0; i < inputData.length; i++) {
    const sequence = inputData[i][0];
    const size = +inputData[i][1];
    if (isNaN(size)) {
      continue;
    }
    const parts = sequence.split("-");
    let currentNode = root;
    for (let j = 0; j < parts.length; j++) {
      const children = currentNode["children"];
      const nodeName = parts[j];
      let childNode = null;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree
        let foundChild = false;
        for (let k = 0; k < children.length; k++) {
          if (children[k]["name"] == nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // if we don't already have a child a node for this branch, create it
        if (!foundChild) {
          childNode = { name: nodeName, children: [] };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = { name: nodeName, value: size };
        children.push(childNode);
      }
    }
  }
  return root;
}

function buildSunburst(plotData) {
  const root = d3.partition().size([2 * Math.PI, radius * radius])(
    d3.hierarchy(plotData).sum(d => d.value)
      .sort((a, b) => b.value - a.value));
  //console.log(root);
  const svg = d3.select("#viz3").append("svg");
  const element = svg.node();
  element.value = { sequence: [], dollarsum: 0.0 };

  const label = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "#888")
    .style("visibility", "hidden");

  label
    .append("tspan")
    .attr("class", "dollarsum")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "-0.1em")
    .attr("font-size", "3em")
    .text("");

  label
    .append("tspan")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "1.5em")
    .text("in total contributions to selected subgroup");

  label
    .append("tspan")
    .attr("class", "sequence")
    .attr("x", 0)
    .attr("y", 15)
    .attr("dy", "1.5em")
    .text("");

  svg
    .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
    .style("max-width", `${width}px`)
    .style("font", "12px sans-serif");

  const path = svg
    .append("g")
    .selectAll("path")
    .data(
      root.descendants().filter(d => {
        return d.depth && d.x1 - d.x0 > 0.001;
      })
    )
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseleave", () => {
      path.attr("fill-opacity", 1);
      label.style("visibility", "hidden");
      element.value = { sequence: [], dollarsum: 0.0 };
      element.dispatchEvent(new CustomEvent("input"));
    })
    .selectAll("path")
    .data(
      root.descendants().filter(d => {
        return d.depth && d.x1 - d.x0 > 0.001;
      })
    )
    .join("path")
    .attr("d", mousearc)
    .on("mouseenter", d => {
      const sequence = d
        .ancestors()
        .reverse()
        .slice(1);
      path
        .attr("fill-opacity", node =>
          sequence.indexOf(node) >= 0 ? 1.0 : 0.3
        );
      const dollarsum = (d.value);
      label
        .style("visibility", null)
        .select(".dollarsum")
        .text('$' + formatMoney(dollarsum));
      label
        .style("visibility", null)
        .select(".sequence")
        .text(sequence.map(e => e.data.name).join(", "));

      element.value = { sequence, dollarsum };
      element.dispatchEvent(new CustomEvent("input"));
    });

  return element;
}


