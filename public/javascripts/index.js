var dataArray = [5,10,15,20, 30];
var lineData = [ {x:-40, y:0},  {x:0, y:5},  {x:35, y:4}, {x:60, y:9},  {x:100, y:8}, {x:120, y:13},{x:160, y:12},{x:180, y:17},  {x:220, y:16},  {x:277, y:32}]

var rainbow = d3.scaleSequential(d3.interpolateRainbow).domain([13,17]);

var margin = {left:150, right:100, top:0, bottom:0};

var svg = d3.select("body div.chart").append("svg").attr("height","800px").attr("width","100%");
var chartGroup = svg.append("g").attr("transform", "translate("+margin.left+","+margin.top+")")
                            .attr("class", "svg");

var x = d3.scaleLinear()
                    .domain([0, 600])
                    .range([0, 900]);

var y = d3.scaleLinear()
                    .domain([0, 30])
                    .range([650, 0])

var yRect = d3.scaleLinear()
                            .domain([0, ])
                            .range([])

var line = d3.line()
                        .x(function(d, i) {return x(d.x) +200  ;})
                        .y(function(d, i) {return y(d.y) + 100 ; });

chartGroup.selectAll("rect")
        .data(dataArray)
        .enter().append("rect")
            .attr("id", "chartRect")
            .attr("fill", function(d,i) {return rainbow(i); })
            .attr("x", function(d,i) {return 90*i+200; })
            .attr("y", function(d,i) {return 750-(d*18); })
            .transition().duration(1000).delay(2200)
            .ease(d3.easeQuadIn)
                .attr('height', function(d,i) {return d*18; })
                .attr('width', "75");

var path = chartGroup.append("path")
                    .attr("d", line(lineData))


var totalLength = path.node().getTotalLength();

path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .attr("class", "line")
    .transition()
    .duration(2000)
    .ease(d3.easeQuadIn)
    .attr("stroke-dashoffset", 0);


console.log(d3.symbolTriangle)
setTimeout(addTraingle, 2000);

function addTraingle(){
    var arrow =  chartGroup.append("path")
                            .attr("d",d3.symbol().type(d3.symbolTriangle))
                            .attr("transform", "translate(610,80) rotate(14) scale(5,5)")
                            .attr("class", "triangle");
}
