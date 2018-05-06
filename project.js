//Formatting for Displaying dates on the histogram xaxis
var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%b"),
    formatYear = d3.timeFormat("%Y");

function multiFormat(date) {
  return (d3.timeSecond(date) < date ? formatMillisecond
    : d3.timeMinute(date) < date ? formatSecond
    : d3.timeHour(date) < date ? formatMinute
    : d3.timeDay(date) < date ? formatHour
    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
    : d3.timeYear(date) < date ? formatMonth
    : formatYear)(date);
};

//setup for dealing/printing different dates/times

var parser = d3.timeParse("%d%b%Y:%H:%M:%S");
var parser2 = d3.timeParse("%B %e, %Y");
var timeparse = d3.timeParse("%H:%M:%S");

//creates/histogram based on dates selected
function updatehistogram(selection, part){
//clears svg so that histogram can be redrawn with this function
  d3.select("#barlayer").remove();

  var values = selection.map(function(d){return +d.StatusDate;});
    //console.log(selection);
  var margin = {top: 50, right: 30, bottom: 20, left: 40},
    width = 700 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
  var formatTime = d3.timeFormat("%b %e, %Y");
  var count=40;
    //console.log(d3.extent(values));
  var x = d3.scaleTime()
    .domain(d3.extent(values))
    .range([0,width])
    .nice(count);

  var y = d3.scaleLinear()
    .range([height, 0]);

  var histogram= d3.histogram()
    .value(function(d) { return d; })
    .domain(x.domain())
    .thresholds(x.ticks(count));

  var svg = d3.select(part)
    .append("svg")
    .attr("id", "barlayer")
    .attr("width", width+margin.left+margin.right)
    .attr("height", height+margin.top +margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

  var bins=histogram(values);
    //console.log(bins);

  y.domain([0, d3.max(bins, function(d) { return d.length; })]);
  
  var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", 1)
    .attr("transform", function(d) {
		  return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
    .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
    .attr("height", function(d) { return height - y(d.length); })
    .attr("num", function(d){return d.length;})
    .attr("bin1", function(d){return formatTime(d.x0);})
    .attr("bin2", function(d){return formatTime(d.x1);})
    .on("mouseover",function(d){
        d3.select(this)
        .style("fill","blue");

        var min=d3.select(this).attr("bin1");
        var max=d3.select(this).attr("bin2");
        var num=d3.select(this).attr("num");
          // console.log(min);
        div.transition()		
          .duration(200)		
          .style("opacity", ".9");		
        div.html(min + "-"  + max + "<br/>"+num + " thefts")	
          .style("left", (d3.event.pageX) + "px")		
          .style("top", (d3.event.pageY - 28) + "px");
         })
    .on("mouseout", function(d){
        d3.select(this)
          .style("fill", "black");
        div.transition()		
          .duration(500)		
          .style("opacity", "0");	
        })  ;
 
  var title= svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", (0))
    .attr("text-anchor", "middle")  
    .attr("font-size", "18px")  
    .text("Histogram of Thefts");

  var xAxis =d3.axisBottom().scale(x).tickFormat(multiFormat);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .call(d3.axisLeft(y));

};

//creates date slider and updates the rest of the vis

function createSlider(divId, mapid, data, histid, tableid) {


  function timestamp(str){
    return new Date(str).getTime();}

  var  months = [
		"January", "February", "March",
		"April", "May", "June", "July",
		"August", "September", "October",
		"November", "December"
	];

  function formatDate( date ) {
    return months[date.getMonth()] +  " " + date.getDate()  +", " +
        date.getFullYear();}

  var date = new Date();

  var slider = document.querySelector(divId);

  function toFormat ( v ) {
    return formatDate(new Date(v));}

  noUiSlider.create(slider, {
       tooltips: [ true, true ],
       format: { to: toFormat, from: Number },
       range: {
          min: timestamp("01 January 2017"),
          max: timestamp("31 March 2018" )
               },
        step: 24 * 60 * 60 * 1000,
        start: [ timestamp("2017"), timestamp("2019") ],
        connect: true        
    });
    // specify the change callback

  var values = [
	document.getElementById("event-start"),
	document.getElementById("event-end")];

  function interested(data,dates){
    return data.filter(function(d){return d.StatusDate<=parser2(dates[1]) && d.StatusDate >= parser2(dates[0])});};

  slider.noUiSlider.on("update", function( values, handle ) {
    values[handle].innerHTML = values[handle];
      //console.log(values);
    var selection=interested(data,values);
      //console.log(selection);


    updatehistogram(selection, histid);
    fillbubbles(mapid, selection);
     //updatebubbles(values, selection); 
    drawtable(selection, tableid);
});

}

//function that creates table

function drawtable(data, divid){

//console.log(data);
//more date formatting/functions for getting values for columns
  var formatTableDate = d3.timeFormat("%m/%d/%Y");
  var formatTableTime = d3.timeFormat("%H:%M:%S");
  var getdates = function(data) { return formatTableDate(data.StatusDate); };
  var getamount = function(data) { return data.Amount; };
  var getzip = function(data) { return data.zip; };
  var getstate = function(data) {return data.state;};
  var gettime = function(data) {return formatTableTime(data.StatusTime);};

//for sorting by column header
  var sortAscending=true;

  var width=  d3.select(divid).style("width");
  var height=  d3.select(divid).style("height");
//console.log(width);
  //variables of interest for table
  var titles = ["StatusDate", "StatusTime", "Amount", "zip", "state"];

//console.log(titles);
//clears table for redraw
  d3.select("#tablelayer").remove();

var table=d3.select(divid).append("table").attr("id","tablelayer").attr("width", width).attr("height",height).style("border-collapse", "collapse");

  //var titles = d3.keys(data[0]).filter(function(d){return d == "StatusDate" ||}; 

//console.log(titles);

//adds headers and makes them sortable
var headers=table.append("thead").append("tr")
  .selectAll("th")
  .data(titles).enter()
  .append("th")
  .text(function(d){return d})
  .on("click", function(d){
    headers.attr("class","header");
      if(d=="state"){
        if(sortAscending){
          rows.sort(function(a,b){
            return d3.ascending(a[d],b[d]);
        });
        sortAscending =false;
        this.className= "aes";
        }
        else{
        rows.sort(function(a,b){
          return d3.descending(a[d], b[d]);
        });
        sortAscending=true;
        this.className="des";
        }
      }
      else{
        if(sortAscending){
          rows.sort(function(a,b){
            return b[d]-a[d];
        });
        sortAscending =false;
        this.className= "aes";
        }
        else{
        rows.sort(function(a,b){
          return a[d]- b[d];
        });
        sortAscending=true;
        this.className="des";
        }
     }

});

//adds rows
var rows = table.append("tbody").selectAll("tr")
      .data(data).enter()
      .append("tr");
 
rows.selectAll("td")
      .data(function(d) {
         return [getdates(d),gettime(d),getamount(d),getzip(d), getstate(d)];})
       .enter()
      .append("td")
      .text(function(d) {return d;})
      .attr("data-th", function(d) {
        return d.name;
      });

//Fixes header titles to not be variable names
table.selectAll("thead th").text(function(column){
   if (column.charAt(0)=="S")
    {return column.substr(6);}  
    if (column.charAt(0)=="A")
    {return "Amount (in Gallons)";}
    return column.charAt(0).toUpperCase() + column.substr(1);})

     
}

//Realized that one of the companies hadn't been cleaned out of database, didn't want an incomplete picture of the thefts so limited it to 2017-2017

function cleandata(data){return data.filter(function(d){return  d.StatusDate >= parser2("January 1, 2017") && d.Amount>0});};

//Create map with markers for all locations

function initialmap(data, svg){
 //d3.select(map).remove();
  

   var map = L.map("map1").setView([38, -95.5], 3.5);
    mapLink = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

 var svgLayer = L.svg();
    svgLayer.addTo(map);


    var svg = d3.select("#map1").select("svg").attr("id","maplayer");
    var g = svg.select("g");

  var zips=data; 
  zips.forEach(function(d){
    d.LatLng = new L.LatLng(d.value.y, d.value.x)
  });

 
  //console.log(zips);

  var feature=g.selectAll("circle")
    .data(zips) 
    .enter().append("circle") 
    .attr("id", function(d) { return d.key; })
    .attr("r", 3)
    .style("fill", "white")
    .style("stroke", "black")
    .style("opacity", ".6")
    .style("stroke-width",1);


  function updatemap(){

            feature.attr("transform",
                function(d) {
                    var layerPoint = map.latLngToLayerPoint(d.LatLng);
                    return "translate("+ layerPoint.x +","+ layerPoint.y +")";
                
         })

         };
 updatemap();
  map.on("moveend", updatemap)


};

//apply fill to bubbles based on data

function fillbubbles(div, data){

//first clear reset to white
  d3.select(div).select("svg").selectAll("circle")
    .style("fill", "white")
    .attr("r", 3);
  //console.log(data);

//get totals & count of thefts in filtered data
   var nest =d3.nest()
     .key(function(d){return d.zip;})
     .rollup(function(d){return {"count": d.length ,"total": d3.sum(d, function(b){return b.Amount})}})   
     .entries(data);
  //console.log(nest);

//tried to setup fill color & radius scale
var scaleRadius = d3.scaleLinear()
            .domain(d3.extent(nest, d => d.value.total))
            .range([2,7]);

var color= d3.scaleSequential(d3.interpolateYlOrRd)
    .domain(d3.extent(nest, d => d.value.total)); 

//update fill and size based on data, issue with this is that it no longer resizes with the zoom

d3.select(div).select("svg").selectAll("circle").data(nest)
    //.style("fill", color)
    //.attr("r", scaleRadius)
    .style("fill", "red")
    .attr("r", 4)
    .on("mouseover",function(d){
        d3.select(this)
        .style("opacity", 1);

        var min=d3.select(this).attr("id");
        div.transition()		
          .duration(200)		
          .style("opacity", ".9");		
        div.html("ZIP:"  + id )	
          .style("left", (d3.event.pageX) + "px")		
          .style("top", (d3.event.pageY - 28) + "px");
         })
    .on("mouseout", function(d){
        d3.select(this)
          .style("opacity", .6);
        div.transition()		
          .duration(500)		
          .style("opacity", "0");	
        })  ;;

};




function processData(errors, file1data, file2data) {

//do some data restructuring
  file1data.forEach(function(d) {
    fulldatetime = d.StatusDate+":"+d.StatusTime;
    d.StatusTime = timeparse(d.StatusTime);
    d.StatusDate = parser(fulldatetime);


    })
//console.log(file1data);
  var locations =file2data;

//get a datset with just all zips
  var allzips=d3.nest().key(function(d){return d.zip;})
     .rollup(function(d){return {count: d.length ,x : d3.max(d, function(b){return b.X}), y : d3.max(d, function(b){return b.Y})}}) 
     .entries(locations);
     //console.log(allzips);
console.log(allzips);
var tests ={};
allzips.forEach(function(d){
});
//call function to make a locations appear
                       
  initialmap(allzips, "#map1");

//apply datafilter to get rid of earlier thefts
  file1data=cleandata(file1data);
//create slider and update other divs
  createSlider("#dates", "#map1", file1data, "#hist1", "#table");

}

d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/ahaines11/Project/master/Data/THEFTAH.csv")
    .defer(d3.csv, "https://raw.githubusercontent.com/ahaines11/Project/master/Data/LOCtheft.csv")
    .await(processData);





