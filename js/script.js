
// --------------- Setup Variables

var adafruitIOUsername = ""                       // Adafruit IO username
var adafruitIOFeedname = ""                       // Adafruit IO feed name
var numberOfhistoryDataPoints = "60"              // Number of data points shown on history chart
var usertimeZone = "Africa/Johannesburg"          // Transforms the time to your time zone
var yAxisDataLabel = 'Pressure'                   // Add a label to your data on history chart
var yAxisTickValues = [0,125,250,375,500]         // Values to show on the y-axis
var warningMinSinceLastUpdate = 15                // How long (in minutes) before showing yellow warning message
var dataMinMax = [0,500]                          // Max and min value for both charts
var gaugeUnit = "kPa"                             // Adds a unit to the gauge
var gaugeColorSwitchValues = [30,60,90,100]       // Changes color of gauge based on these values [<=red, orange, yellow, >=green]
var historyChartRedGreenValue = 100               // The region above this will have a green background, below will have red
var autoRefreshInterval = 0                       // How long (in seconds) between auto refreshing. If 0, will not auto refresh.
var refreshDelay = 5                              // How long (in seconds) to show loading icon when refresh is button is pressed 
var enableLogging = false                         // Enables console.logs

// --------------- Function Declaration

function retrieveFromIO(){
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

        document.querySelector(".lds-roller").style = "display:none;"

        if (enableLogging){
          console.log("Response from Adafruit.IO")
          console.log(data);
        }

        minSinceLastUpdate = Math.round((Date.now() - Date.parse(data[0].created_at))/1000/60,2)

        if (minSinceLastUpdate > warningMinSinceLastUpdate){

          statusAlert("Data is "+minSinceLastUpdate+" minutes old, sensor does not have power or internet access.","warning")

        } else {

          var alertText = ''

          if (minSinceLastUpdate < 1){
            alertText = "Data updated less than a minute ago."         
          }
          if (minSinceLastUpdate == 1){
            alertText = "Data updated a minute ago."         
          }
          if (minSinceLastUpdate > 1){ 
            alertText = "Data updated "+minSinceLastUpdate+" minutes ago."
          }

          statusAlert(alertText,"success")

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

        document.querySelector(".lds-roller").style = "display:none;"

        statusAlert("Unable to connect to service, please reload page.","warning")

    });

}

function statusAlert(msg,alertType) {
  var alertElement = document.getElementById('alertArea')

  alertElement.innerText = msg;
  alertElement.className = "alert alert-"+alertType;
  alertElement.style = "display:block";

}

function delayedRetrieveFromIO(delay){  // retrieves from IO after delay
  document.querySelector(".lds-roller").style = "display:block;"
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
        "#FF0000",
        "#F97600",
        "#F6C600",
        "#60B044"
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

if (autoRefreshInterval){ // refreshes after a certain interval
  intervalId = window.setInterval(function(){
    document.querySelector(".lds-roller").style = "display:block;"
    retrieveFromIO()
  }, autoRefreshInterval*1000)
}

document.getElementById("refreshButton").addEventListener("click", function() { // adds functionality to refresh button
  delayedRetrieveFromIO(refreshDelay)
})

document.addEventListener("visibilitychange", function() {
  if (!document.hidden) {
    delayedRetrieveFromIO(refreshDelay)
  } 
});

// --------------- Main Code

if (adafruitIOUsername == "" || adafruitIOFeedname == ""){ // if username or feedname are blank, check query parameters for the information
  urlParams = new URLSearchParams(window.location.search)
  adafruitIOUsername = urlParams.get("adafruitIOUsername")
  adafruitIOFeedname = urlParams.get("adafruitIOFeedname")
}

retrieveFromIO()