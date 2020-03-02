// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)
// const domReady = require('domready');

document.addEventListener('DOMContentLoaded', () => {
  Viz1();
  Viz2();
  Viz3();

  //fetch('./data/county_scatter.json')
  //  .then(response => response.json())
  //  .then(data => Viz2(data))
  //  .catch(e => {
  //    console.log(e);
  //  });
});

function Viz1() {

  d3.csv("./data/county_lines.csv")
    .then(function (data) {
      const columns = data.columns.slice(1);
      const newData = {
        y: "% Dem vote share",
        series: data.map(d => ({
          name: d.COUNTY,
          values: columns.map(k => +d[k])
        })),
        dates: [2012, 2014, 2016, 2018]
      };

      var margin = ({ top: 20, right: 20, bottom: 30, left: 30 });
      var height = 460;
      var width = 600;

      line = d3.line()
        .defined(d => !isNaN(d))
        .x((d, i) => x(newData.dates[i]))
        .y(d => y(d))

      yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(newData.y))

      xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

      y = d3.scaleLinear()
        .domain([0, d3.max(newData.series, d => d3.max(d.values))]).nice()
        .range([height - margin.bottom, margin.top])

      x = d3.scaleLinear()
        .domain(d3.extent(newData.dates))
        .range([margin.left, width - margin.right])


      var svg = d3.select("#viz1").append("svg")
        .style("overflow", "visible");

      svg.append("g")
        .call(xAxis);

      svg.append("g")
        .call(yAxis);

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
          .attr("r", 2.5);

        dot.append("text")
          .style("font", "10px sans-serif")
          .attr("text-anchor", "middle")
          .attr("y", -8);

        function moved() {
          d3.event.preventDefault();
          const ym = y.invert(d3.event.layerY);
          const xm = x.invert(d3.event.layerX);
          const i1 = d3.bisectLeft(newData.dates, xm, 1);
          const i0 = i1 - 1;
          const i = xm - newData.dates[i0] > newData.dates[i1] - xm ? i1 : i0;
          const s = newData.series.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);
          path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
          dot.attr("transform", `translate(${x(newData.dates[i])},${y(s.values[i])})`);
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

      const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .selectAll("path")
        .data(newData.series)
        .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", d => line(d.values));

      svg.call(hover, path);

    });
}


function Viz2() {
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3.scaleLinear()
    .range([0, width]);
  var y = d3.scaleLinear()
    .range([height, 0]);
  var sizeScale = d3.scaleSqrt()
    .range([0, 50]);

  var cValue = function (d) { return d.WIN18; },
    color = d3.scaleOrdinal(d3.schemeSet1);
  //var cValue = function (d) { return d.demperc18; },
  //  color = d3.scaleDiverging(d3.schemeRdBu);

  var svg = d3.select("#viz2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("./data/county_scatter.csv")
    .then(function (data) {
      data.forEach(function (d) {
        d.MEDIAN_AGE = +d.MEDIAN_AGE;
        d.PERC_WHITE = +d.PERC_WHITE;
        d.demperc18 = +d.demperc18;
      });

      x.domain(d3.extent(data, function (d) { return d.MEDIAN_AGE; })).nice();
      y.domain(d3.extent(data, function (d) { return d.PERC_WHITE; })).nice();
      sizeScale.domain(d3.extent(data, function (d) { return d.TOTAL_POP; })).nice();

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

      svg.selectAll(".point")
        .data(data)
        .enter().append("path")
        .attr("class", "point")
        .attr("d", d3.symbol().type(d3.symbolCircle))
        .attr("r", 50)
        //.attr("r", function (d) { return sizeScale(d.TOTAL_POP); })
        //.attr("d", function (d) { return shape(sValue(d)); })
        .attr("transform", function (d) { return "translate(" + x(d.MEDIAN_AGE) + "," + y(d.PERC_WHITE) + ")"; })
        .style("fill", function (d) { return color(cValue(d)); })
        .style("opacity", 0.7);
    });


}



function Viz3() {
  const margin = ({ top: 20, right: 20, bottom: 30, left: 20 });
  const padding = 1.5;
  const radius = 3;
  const height = 240;
  const width = 500;

  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))

  x = d3.scaleLinear()
    .range([margin.left, width - margin.right])

  d3.csv("./data/tx_nominate.csv")
    .then(function (data) {
      var newData = data.map(d => ({
        name: d.bioname,
        district: d.district_code,
        party: d.party_code,
        score: +d.nominate_dim1
      }))
      console.log(newData);

      x.domain(d3.extent(newData, function (d) { return d.score; })).nice();

      dodge = (data, radius) => {
        const radius2 = radius ** 2;
        const circles = data.map(d => ({ x: x(d.score), data: d })).sort((a, b) => a.x - b.x);
        console.log(circles);
        const epsilon = 1e-3;
        let head = null, tail = null;

        // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
        function intersects(x, y) {
          let a = head;
          while (a) {
            if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
              return true;
            }
            a = a.next;
          }
          return false;
        }

        // Place each circle sequentially.
        for (const b of circles) {

          // Remove circles from the queue that can’t intersect the new circle b.
          while (head && head.x < b.x - radius2) head = head.next;

          // Choose the minimum non-intersecting tangent.
          if (intersects(b.x, b.y = 0)) {
            let a = head;
            b.y = Infinity;
            do {
              let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
              if (y < b.y && !intersects(b.x, y)) b.y = y;
              a = a.next;
            } while (a);
          }

          // Add b to the queue.
          b.next = null;
          if (head === null) head = tail = b;
          else tail = tail.next = b;
        }

        return circles;
      }

      var svg = d3.select("#viz3").append("svg")

      svg.append("g")
        .call(xAxis);

      svg.append("g")
        .selectAll("circle")
        .data(dodge(newData, radius * 2 + padding))
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => height - margin.bottom - radius - padding - d.y)
        .attr("r", radius);
    })
}

