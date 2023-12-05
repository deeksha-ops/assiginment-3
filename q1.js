console.log("Starting");

function simulate(data, svg) {
  const width = parseInt(svg.attr("viewBox").split(" ")[2]);
  const height = parseInt(svg.attr("viewBox").split(" ")[3]);
  const main_group = svg.append("g").attr("transform", "translate(0, 50)");

  let nodeSize = "publications"; // Default node size option

  // Function to update node size based on radio button selection
  function updateNodeSize(option) {
    nodeSize = option;
    updateNodeRadius();
  }

  // Add event listener to update node size when radio button changes
  d3.selectAll('input[name="nodeSize"]').on("change", function () {
    updateNodeSize(this.value);
  });

  // Function to update node radius based on selected node size
  function updateNodeRadius() {
    node_elements.selectAll("circle").attr("r", function (d) {
      switch (nodeSize) {
        case "publications":
          return scale_radius(d.Authors.length);
        case "degree":
          return scale_radius(node_degree[d.id]);
        case "citations":
          return scale_radius(d.Citations / 8);
        default:
          return scale_radius(0);
      }
    });
  }

  // Extract unique countries
  const uniqueCountries = Array.from(
    new Set(data.nodes.map((node) => node.Country))
  );

  //calculate degree of the nodes:
  let node_degree = {}; //initiate an object
  d3.map(data.links, (d) => {
    if (d.source in node_degree) {
      node_degree[d.source]++;
    } else {
      node_degree[d.source] = 0;
    }
    if (d.target in node_degree) {
      node_degree[d.target]++;
    } else {
      node_degree[d.target] = 0;
    }
  });

  const scale_radius = d3
    .scaleLinear()
    .domain(d3.extent(Object.values(node_degree)))
    .range([3, 12]);

  const color = d3
    .scaleSequential()
    .domain([1995, 2020])
    // .domain([0, uniqueCountries.length])
    .interpolator(d3.interpolateViridis);

  function mapValueToRange(value, fromMin, fromMax, toMin, toMax) {
    return parseInt(
      ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin
    );
  }

  // Create references to the input range elements
  let collideInput = document.getElementById("collide");
  let chargeInput = document.getElementById("charge");
  let linkStrengthInput = document.getElementById("linkStrength");
  let collide_value = document.getElementById("collide_value");
  let charge_value = document.getElementById("charge_value");
  let linkStrength_value = document.getElementById("linkStrength_value");

  // Add event listeners to update the forces when the inputs change
  collideInput.addEventListener("input", updateCollideForce);
  chargeInput.addEventListener("input", updateChargeForce);
  linkStrengthInput.addEventListener("input", updateLinkStrength);

  // Initialize the forces with default values
  let collideForce = d3.forceCollide().radius(0);
  let chargeForce = d3.forceManyBody().strength(-55);
  let linkForce = d3
    .forceLink(data.links)
    .id((d) => d.id)
    .strength(0.4);
  // .distance(10);

  // Create the force simulation
  let ForceSimulation = d3
    .forceSimulation(data.nodes)
    .force("collide", collideForce)
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", chargeForce)
    .force("link", linkForce)
    .on("tick", ticked);

  // Function to update collide force
  function updateCollideForce() {
    let radius = parseInt(collideInput.value);
    collide_value.innerHTML = radius;
    collideForce.radius(radius);
    ForceSimulation.alpha(0.5).restart();
  }

  // Function to update the charge force
  function updateChargeForce() {
    let strength = parseInt(chargeInput.value);
    charge_value.innerHTML = strength;
    chargeForce.strength(strength);
    ForceSimulation.alpha(0.5).restart();
  }

  // Function to update the link strength
  function updateLinkStrength() {
    let strength = parseFloat(linkStrengthInput.value);
    linkStrength_value.innerHTML = strength;
    linkForce.strength(strength);
    ForceSimulation.alpha(0.5).restart();
  }

  // Adding Link Marks
  let link_elements = main_group
    .append("g") // a new group is added first to have a layer specific for the link marks.
    .attr("transform", `translate(${width / 2},${height / 2})`) // translate all the link marks to the center.
    .attr("stroke", "#999") // stroke color
    .attr("stroke-width", "3")
    .attr("stroke-opacity", 0.6)
    .selectAll(".line")
    .data(data.links) // Bind the data
    .enter()
    .append("line"); // Append a line (svg element)

  // const treatPublisherClass = (Publisher) => {
  //   let tmp = Publisher.toString().split(" ").join("");
  //   tmp = tmp.split(".").join("");
  //   tmp = tmp.split(",").join("");
  //   tmp = tmp.split("/").join("");
  //   return "gr" + tmp;
  // };

  const node_elements = main_group
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll(".circle")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("r", (d) => d.Citations)

    // Apply the "Hue Channel" for the Author's country of affiliation
    // .attr("fill", (d) => color(uniqueCountries.indexOf(d.Country)))
    .attr("fill", (d) => color(d.Year))

    // Add a class to nodes based on the author's country
    .attr("class", function (d) {
      return "gr" + d.Country.replace(/\s+/g, "-").toLowerCase();
    })
    // .attr("class", function (d) {
    //   return treatPublisherClass(d.Publisher);
    // })
    .on("click", function (d, data) {
      console.log(data);
      d3.selectAll("#Paper_Title").text(` ${data.Title}`);
      d3.selectAll("#author_name").text(` ${data.Authors}`);
      d3.selectAll("#publisher").text(` ${data.Publisher}`);
      d3.selectAll("#country").text(` ${data.Country}`);
      d3.selectAll("#year").text(` ${data.Year}`);
      node_elements.classed("inactive", true);
      const selectedClass = d3.select(this).attr("class").split(" ")[0];
      d3.selectAll(".gr_" + selectedClass).classed("inactive", false);
    });
  // .on("mouseout", function (d, data) {
  //   d3.selectAll("#Paper_Title").text(" ");
  //   d3.selectAll("#author_name").text(" ");
  //   d3.selectAll("#publisher").text(" ");
  //   node_elements.classed("inactive", false);
  // });

  node_elements.append("circle").attr("r", function (d, i) {
    if (node_degree[d.id] !== undefined) {
      return scale_radius(node_degree[d.id]);
    } else {
      return scale_radius(0);
    }
  });

  function ticked() {
    node_elements.attr("transform", (d) => `translate(${d.x},${d.y})`);
    link_elements
      .attr("x1", (d) => d.source.x)
      .attr("x2", (d) => d.target.x)
      .attr("y1", (d) => d.source.y)
      .attr("y2", (d) => d.target.y);
  }
  svg.call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([-1, 8])
      .on("zoom", zoomed)
  );
  function zoomed({ transform }) {
    main_group.attr("transform", transform);
  }

  // Call the updateNodeRadius function initially
  updateNodeRadius();
}
