const ResearchWidget = (data) => {
  const svg = d3.select("#research-widget");
  const windowWidth = window.innerWidth;
  const width = windowWidth>1024 ? 1000 : windowWidth>768 ? 600 : 400;
  const height = windowWidth>1024 ? 800 : windowWidth>768 ? 600 : 400;
  svg.attr("width", width);
  svg.attr("height", height);

  const bigRectLength = windowWidth>1024 ? 80 : windowWidth>768 ? 60 : 40;
  const bigRectBorderRadius = bigRectLength / 15;
  const smallRectLength = bigRectLength / 5;
  const smallRectBorderRadius = smallRectLength / 4;
  const fontSize = 12;
  const xOffset = document.getElementById('research-widget').getBoundingClientRect().x;
  const markerBoxLength = 4;
  const ref = markerBoxLength / 2;
  const xDiff = xOffset - smallRectLength/2;
  const yDiff = 50;
  const minBoundingX = 1, maxBoundingX = width - bigRectLength*3 - 1;
  const minBoundingY = 1, maxBoundingY = height - bigRectLength*2 - smallRectLength - yDiff -1;

  const arrowPoints = [[0, 0], [0, markerBoxLength], [markerBoxLength, ref]];

  const colorArray = ["#C7E8AC", "#99D2F2","#F28F80"]

  const tooltip = d3.select(".tooltip");
  
  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  
  /* DEFS FOR THE LOCK IMAGE */
  svg.append('defs')
    .append('pattern')
      .attr('id', 'pic1')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', bigRectLength)
      .attr('height', bigRectLength)
    .append('svg:image')
      .attr('xlink:href', 'lock_img.png')
      .attr("width", bigRectLength)
      .attr("height", bigRectLength)
      .attr("x", 0)
      .attr("y", 0);

  /* DEFS FOR MARKER */
  svg
    .append('defs')
    .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', [0, 0, markerBoxLength, markerBoxLength])
      .attr('refX', ref)
      .attr('refY', ref)
      .attr('markerWidth', markerBoxLength)
      .attr('markerHeight', markerBoxLength)
      .attr('orient', 'auto-start-reverse')
    .append('path')
      .attr('d', d3.line()(arrowPoints))
      .attr('stroke', 'rgb(94, 94, 94)')
      .attr('fill', 'rgb(94, 94, 94)')


  function dragStarted(d) {
    d3.select(this).moveToFront();
    tooltip.style("opacity", "0")
  }
  function dragged(d) {
    if(
      (d.fx + d3.event.dx) > maxBoundingX ||
      (d.fx + d3.event.dx) < minBoundingX ||
      (d.fy + d3.event.dy) > maxBoundingY ||
      (d.fy + d3.event.dy) < minBoundingY
    ){
      d3.event.sourceEvent.stopPropagation();
      return;
    }

    d.fx += d3.event.dx;
    d.fy += d3.event.dy;

    const tooltipRect = tooltip.node().getBoundingClientRect();

    tooltip.style('top', d.fy - tooltipRect.height + 'px').style('left', (d.fx + xDiff - 2 - tooltipRect.width / 2 + bigRectLength * 1.5) + 'px');

    d3.select(this).attr("transform", `translate(${d.fx},${d.fy})`)
    updateEdge(d.widget_id);
    d3.select(this).moveToFront();
  }

  const groups = svg.selectAll('g')
    .data(data["widgets"]).enter()
    .append('g')
      .attr('id', (d) => {				
        const dx = d3.randomUniform(minBoundingX, maxBoundingX)();
        const dy = d3.randomUniform(minBoundingY, maxBoundingY)();
        d.fx = dx; d.fy = dy;

        return d.widget_id;
      })
      .attr("transform", (d) => `translate(${d.fx},${d.fy})`)
      .attr("render-order", 1)
      .call(d3.drag().on('start', dragStarted).on('drag', dragged));
  
  // Lock rect
  groups.append("rect")
    .attr("transform", `translate(${bigRectLength}, 0)`)
    .attr("rx", bigRectBorderRadius)
    .attr("ry", bigRectBorderRadius)
    .attr("fill", "url(#pic1)")
    .attr('width', bigRectLength)
    .attr('height', bigRectLength)
    .attr('class', 'bigRect lock')
    .on('mousedown', (d) => {
      tooltip.html(`<p>URL:${d.url} </p> <p> Timestamp: ${d.timestamp} </p>`)
              .transition().duration(300).style("opacity", "1");
      
      const tooltipRect = tooltip.node().getBoundingClientRect();
      tooltip.style('top', d.fy - tooltipRect.height + 'px').style('left', (d.fx + xDiff - 2 - tooltipRect.width / 2 + bigRectLength * 1.5) + 'px');
    });

  const nodeGroup = groups.selectAll('g')
      .data(d=>d.entities.map(entity=>{
        return {...entity, id: `${d.widget_id}_${entity.name}`}
      })).enter()
      .append('g')
        .attr("transform", (d,i) =>(`translate(${(bigRectLength) * i}, ${bigRectLength})`))
        .on('mousedown', ()=>tooltip.transition().duration(200).style("opacity", "0"));
    nodeGroup.append("rect")
      .attr("rx", bigRectBorderRadius)
      .attr("ry", bigRectBorderRadius)
      .attr('fill', (d,i)=> colorArray[i])
      .attr('width', bigRectLength)
      .attr('height', bigRectLength)
      .attr('class', 'bigRect');
    nodeGroup.append("text")
      .text(d=> d.name)
      .attr('dy', bigRectLength/2 + (fontSize/2))
      .attr('dx', bigRectLength/2)
    nodeGroup.append("rect")
      .attr("id", d => d.id)
      .attr("x", bigRectLength/2 - smallRectLength/2)
      .attr("y", bigRectLength)
      .attr("rx", smallRectBorderRadius)
      .attr("ry", smallRectBorderRadius)
      .attr('width', smallRectLength)
      .attr('height', smallRectLength)
      .attr('fill', "#fff")

  /* FUNCTION TO CREATE LINE */
  var linkVertical = d3.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  function makeEdge(d) {
    var source = document.getElementById(`${d.source_widget}_${d.source_entity}`).getBoundingClientRect();
    var target = document.getElementById(`${d.destination_widget}_${d.destination_entity}`).getBoundingClientRect();
    
    var maxY = Math.max(source.y, target.y) + yDiff;
    return [
      {"x": source.x-xDiff, "y": source.y + smallRectLength/2},
      {"x": source.x-xDiff, "y": maxY},
      {"x": target.x-xDiff, "y": maxY},
      {"x": target.x-xDiff, "y": target.y + smallRectLength/2}
    ];
  }
  const edges = svg.selectAll('.edge')
    .data(data.connections).enter()
    .append("path")
    .attr('class', 'edge')
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("d", d=>linkVertical(makeEdge(d)))
    .attr("render-order", -1);

  function updateEdge(widgetId) {
    var edge = edges.filter(d => d.source_widget === widgetId || d.destination_widget === widgetId).nodes();
    edge.forEach((e) => {
      const selection = d3.select(e);
      selection.attr("d", d=>linkVertical(makeEdge(d)))
      selection.moveToFront();
    })
  }
}

/* SECTION TO RETRIEVE DATA  AND CALL THE FUNCTION */
// d3.json("data.json").then((data) => {
//   ResearchWidget(data)
// });

const data = { 
	"widgets" : [
		{
			"widget_id" : "123",
			"url"       : "http://www.google.com",
			"timestamp" : "May 16, 2021 12:52:22 UTC",
			"entities"  : [
					{"name": "A","hash":"SHA-256"},
					{"name": "B","hash":"SHA-256"},
					{"name": "C","hash":"SHA-256"}
			]
		},
		{
			"widget_id" : "456",
			"url"       : "http://www.bing.com",
			"timestamp" : "May 17, 2021 12:24:38 UTC",
			"entities"  : [
				{"name":"A","hash":"SHA-256"},
				{"name":"D","hash":"SHA-256"},
				{"name":"K","hash":"SHA-256"}
			]
		},
		{
			"widget_id" : "345",
			"url"       : "http://www.yandex.ru",
			"timestamp" : "May 17, 2021 12:24:38 UTC",
			"entities"  : [
				{"name":"Y","hash":"SHA-256"},
				{"name":"J","hash":"SHA-256"},
				{"name":"K","hash":"SHA-256"}
			]
		}
	],
	"connections" : [
		{
			"source_widget" : "123",
			"source_entity" : "A",
			"destination_widget" : "456",
			"destination_entity" : "A"
		},
		{
			"source_widget" : "456",
			"source_entity" : "K",
			"destination_widget" : "345",
			"destination_entity" : "K"
		}
	]
}

ResearchWidget(data);