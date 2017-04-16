var parseDate = d3.timeParse("%Y-%m-%d %H:%M %p");

var height = 500;
var width = 1000;
var y, x;
var line;
var minPrice;
var minDate;
var xAxis, yAxis;

stockId = 'ABB'

d3.json("/line?stockId="+stockId)
    // .row(function(d) { return  {time: d.ltt.split(" ")[0], month: parseDate(d.lt_dts.substr(0, 10) ), price: d.l } })
    .get(function(err, data) {

        if(err){
            console.log("An Error occured : ", err);
        }

        var details = parseDetails(data);

        var maxPrice = d3.max(details, function(d) { return d.price; });
        minPrice =  d3.min(details, function(d) { return d.price; });

        minDate = d3.min(details, function(d) { return d.date; });
        var maxDate = d3.max(details, function(d) { return d.date; });


        y = d3.scaleLinear()
                    .domain([0.99 * minPrice, 1.01*maxPrice])
                    .range([height, 0]);

        x = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .range([0,width]);

        yAxis = d3.axisLeft(y);
        xAxis = d3.axisBottom(x);

        var svg = d3.select("body").append("svg").attr("height", "100%").attr("width", "100%");

        var margin = {left:50, right:50, top:40, bottom:0};

        var chartGroup = svg.append("g")
                  .attr("transform", "translate("+margin.left+","+margin.top+")" );


        line = d3.line()
                    .x(function(d){ return x(d.date);  } )
                    .y(function(d){return y(d.price); });

        chartGroup.append("path").attr("d",line(details))
        chartGroup.append("g").attr("class", "x axis").call(xAxis)
                  .attr("transform", "translate(0,"+height+")");
        chartGroup.append("g").attr("class", "y axis").call(yAxis);

        console.log(svg.selectAll("g"));


        var z =setInterval(updateData, 1000);
    });


function updateData() {


    d3.json('/line?stockId='+stockId)
            .get(function(err, data) {
                if(err) {
                    throw err;
                }

                var details = parseDetails(data);

                var maxPrice = d3.max(details, function(d) { return d.price; });

                var maxDate = d3.max(details, function(d) { return d.date; });

                console.log("new data");

                y.domain([0.99 * minPrice, 1.01*maxPrice]);
                x.domain([minDate, maxDate]);

                var svg = d3.select('body').transition();

                svg.select("g").select("path")
                                        .duration(1500)
                                        .attr("d", line(details));

                svg.select("g").select("x axis")
                                        .duration(750)
                                        .call(xAxis);

                svg.select("g").select("y axis")
                                        .duration(750)
                                        .call(yAxis);


            });




}

function parseDetails(data) {
    var details = []

    data.forEach(function(a) {
        details.push({
            price: parseFloat(a.l_fix),
            date: parseDate(a.lt_dts.substr(0, 10) + " " + a.ltt.split(" ")[0].slice(0, -2) + " " +a.ltt.split(" ")[0].substr(-2, 2) )
        });
    });

    return details;
}
