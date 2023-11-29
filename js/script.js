
// --------------- Setup Variables

var adafruitIOUsername = ""                       // Adafruit IO username
var adafruitIOFeedname = ""                       // Adafruit IO feed name
var numberOfhistoryDataPoints = "60"              // Number of data points shown on history chart
var usertimeZone = "Africa/Johannesburg"          // Transforms the time to your time zone
var yAxisDataLabel = 'Water Pressure'             // Add a label to your data on history chart
var yAxisTickValues = [0,125,250,375,500]         // Values to show on the y-axis
var warningMinSinceLastUpdate = 15                // How long (in minutes) before showing warning message that data is old
var dataMinMax = [0,500]                          // Max and min value for both charts
var gaugeUnit = "kPa"                             // Adds a unit to the gauge
var gaugeColorSwitchValues = [30,60,90,100]       // Changes color of gauge based on these values [<=red, orange, yellow, >=green]
var historyChartRedGreenValue = 100               // The region above this will have a green background, below will have red
var autoRefreshInterval = 0                       // How long (in seconds) between auto refreshing. If 0, will not auto refresh. No dependency on refreshDelay
var refreshDelay = 5                              // How long (in seconds) to show loading icon when refreshing. No dependency on autoRefreshInterval
var showRangeComments = true                      // eg. <yAxisDataLabel> is currently zero, <yAxisDataLabel> is within normal range. Uses gaugeColorSwitchValues for limits
var enableLogging = true                          // Enables console.logs present in code

// --------------- Function Declaration

function retrieveFromIO(){ // retrieves data from Adafruit IO and plots charts
  var fetchURL = 'https://io.adafruit.com/api/v2/'+adafruitIOUsername+'/feeds/'+adafruitIOFeedname+'/data/?limit='+numberOfhistoryDataPoints
  fetch(fetchURL).then(function (response) {
	// The API call was successful!
	if (response.ok) {
		return response.json();
	}

	// There was an error
	return Promise.reject(response);

    }).then(function (data) {
        // This is the JSON from our response

        showLoadingSpinner(false)

        if (enableLogging){
          console.log("Response from Adafruit.IO")
          console.log(data);
        }

        minSinceLastUpdate = Math.round((Date.now() - Date.parse(data[0].created_at))/1000/60,2)

        if (minSinceLastUpdate > warningMinSinceLastUpdate){ // checks if data is old, shows warning

          statusAlert("Warning: Gauge and History Charts were last updated "+minSinceLastUpdate+" minutes ago. Sensor has either lost power or internet access.","warning",true)
          
        } else if (showRangeComments){ // if data is not old, comments on the data

          var latestReading = parseFloat(data[0].value)

          if (latestReading <= 0){
            
            statusAlert(yAxisDataLabel+" is currently zero.","danger",true)
            
          } else if (latestReading < gaugeColorSwitchValues[1]){

            statusAlert(yAxisDataLabel+" is very low.","danger",true)

          } else if (latestReading < gaugeColorSwitchValues[3]){

            statusAlert(yAxisDataLabel+" is below normal range.","warning",true)

          } else {

            statusAlert(yAxisDataLabel+" is within normal range.","success",true)

          }

        }
          
        gaugeChart.load({columns: [
          ["Last Reading", parseFloat(data[0].value)]
        ]})

        var xData = []
        var yData = []

        for (i of data){

          var tempDate = new Date (i.created_at)

          xData.push(tempDate.toLocaleString('en-GB', { timeZone: usertimeZone }))
          yData.push(i.value)
        }

        xData.push("x")
        yData.push("Pressure")

        xData = xData.reverse()
        yData = yData.reverse()

        if (enableLogging){
          console.log('x-axis Data for History Chart')
          console.log(xData)
          console.log('y-axis Data for History Chart')
          console.log(yData)
        }

        lineChart.load({columns: [
          xData,  
          yData
        ]})

    }).catch(function (err) {
        // There was an error
        console.warn('Something went wrong.', err);

        showLoadingSpinner(false)

        statusAlert("Unable to connect to service, please reload page.","warning",true)

    });

}

function showLoadingSpinner(status){ // shows loading spinner
  statusAlert("","success",false)
  if (status){
    document.getElementById("loadingSpinner").style = "display:block;"
    darkenCharts(true)

  } else {
    document.getElementById("loadingSpinner").style = "display:none;"  
    darkenCharts(false)

  }
}

function darkenCharts(status){ //darkens the gauge and history chart
  if(status){
    var gaugeColorElement = document.querySelector(".bb-shapes-Last-Reading path") // darken gauge
    if (gaugeColorElement){
      gaugeColorElement.style.fill = "rgba(1,1,1,0.5)"
    }

    var gaugeLegendElement = document.querySelector(".bb-legend-item-Last-Reading line") // darken legend square
    if (gaugeLegendElement){
      gaugeLegendElement.style.stroke = "rgba(1,1,1,0.5)"
    }

    var historyRegion0 = document.querySelector(".bb-region-0 rect") //darken regions on chart
    if (historyRegion0){
      historyRegion0.style.fill = "rgba(1,1,1,0.5)"
    }
    var historyRegion1 = document.querySelector(".bb-region-1 rect") //darken regions on chart
    if (historyRegion1){
      historyRegion1.style.fill = "rgba(1,1,1,0.5)"
    }
  } else {
    var historyRegion0 = document.querySelector(".bb-region-0 rect") //set color of regions on chart
    if (historyRegion0){
      historyRegion0.style.fill = "rgba(74, 180, 70, 1)"
    }
    var historyRegion1 = document.querySelector(".bb-region-1 rect") //set color of regions on chart
    if (historyRegion1){
      historyRegion1.style.fill = "rgba(180, 70, 70, 1)"
    }
  }
}

function statusAlert(msg,alertType,show) { // shows current status
  var alertElement = document.getElementById('alertArea')

  alertElement.innerText = msg;
  alertElement.className = "alert alert-"+alertType;
  if (show){
    alertElement.style = "display:block";
  } else {
    alertElement.style = "display:none";
  }
}

function delayedRetrieveFromIO(delay){  // retrieves from IO after delay
  showLoadingSpinner(true)
  setTimeout(function(){
    retrieveFromIO()
  },delay*1000); 
}

// --------------- Chart Definitions

var gaugeChart = bb.generate({ // Generates the Gauge chart
    data: {
      columns: [
      ],
      type: "gauge",
    },
    gauge: {
        label: {
            format: function (value, ratio) { return value + "\n" + gaugeUnit; },
            color: "white",
        },
        max: dataMinMax[1],
        min: dataMinMax[0],
    },
    color: {
      pattern: [
        "rgb(255, 0, 0)",
        "rgb(249, 118, 0)",
        "rgb(246, 198, 0)",
        "rgb(96, 176, 68)"
      ],
      threshold: {
        values: gaugeColorSwitchValues
      }
    },
    size: {
      height: 180
    },
    bindto: "#gaugeChart"
});
  
var lineChart = bb.generate({ // Generates the History chart
    data: {
      x: "x",
      xFormat: "%d/%m/%Y, %H:%M:%S",
      columns: [
      ],
      type: "line",
      colors: {
        Pressure: "white"
      }
    },
    legend: {
      show: false
    },
    axis: {
      x: {
        label: 'Time',
        type: "timeseries",
        tick: {
          format: "%H:%M",
          rotate: 90,
        }
      },
      y: {
        label: yAxisDataLabel,
        max: dataMinMax[1],
        min: dataMinMax[0],
        tick: {
          values: yAxisTickValues 
        }
      }
    },
    regions: [
      {
        axis: "y",
        start: historyChartRedGreenValue,
        end: dataMinMax[1],
        label: {
          color: ""
        },
      },
      {
        axis: "y",
        start: dataMinMax[0],
        end: historyChartRedGreenValue,
        label: {
          color: ""
        },
      }
    ],

    size: {
      height: 180
    },
    bindto: "#lineChart"
});

// --------------- Listeners for events

if (autoRefreshInterval){ // automatically refreshes after a certain interval
  intervalId = window.setInterval(function(){
    showLoadingSpinner(true)
    retrieveFromIO()
  }, autoRefreshInterval*1000)
}

document.getElementById("refreshButton").addEventListener("click", function() { // refreshes if user taps/clicks button
  delayedRetrieveFromIO(refreshDelay)
})

document.addEventListener("visibilitychange", function() { // refreshes if user returns to page
  if (!document.hidden) {
    delayedRetrieveFromIO(refreshDelay)
  } 
});

// --------------- Main Code

document.getElementById("historyAccordionHeader").innerText = "History (last "+numberOfhistoryDataPoints+" readings)" // adds number of readings to History title

if (adafruitIOUsername == "" || adafruitIOFeedname == ""){ // if username or feedname are blank, check query parameters for the information
  urlParams = new URLSearchParams(window.location.search)
  adafruitIOUsername = urlParams.get("adafruitIOUsername")
  adafruitIOFeedname = urlParams.get("adafruitIOFeedname")
}

showLoadingSpinner(true)

retrieveFromIO()