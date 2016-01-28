(function () {
    "use strict";

    // define our global variables
    // (accessible via html file as well)
    var app = WinJS.Application;
    window.locationList = new WinJS.Binding.List([]);
    window.locationResultList = new WinJS.Binding.List([]);
    window.currentForecast = new WinJS.Binding.List([]);

    // set up our splitview via winjs
    var mySplitView = window.mySplitView = {
        splitView: null,

        /* these methods are called from the win-control in the html */

        // when a location is invoked, show the forecast screen
        locationClicked: WinJS.UI.eventHandler(function (ev) {
            var locationID = ev.currentTarget.winControl.locationID;
            updateUI(getLocation(locationID));
        }),

        // when our 'home' button is tapped (i.e. the '+' button)
        // show the home/add location screen
        addLocationClicked: WinJS.UI.eventHandler(function (ev) {

            Crittercism.leaveBreadcrumb("Showing add location screen");

            document.getElementById("app").classList.add("show-home");
            document.getElementById("app").classList.remove("show-location");
        }),
    };

    // called on app setup
    WinJS.UI.processAll().then(function () {

        // when a search result is tapped, we want to save it
        document.querySelector('#searchResultList').winControl.oniteminvoked = saveLocation;

        // set up our winControls
        mySplitView.splitView = document.querySelector(".splitView").winControl;
        new WinJS.UI._WinKeyboard(mySplitView.splitView.paneElement);
    });

    WinJS.Application.onready = function() {
        Crittercism.init({
            appId: 'appId', // Example: 47cc67093475061e3d95369d
            appVersion: '1.0' // Developer-provided application version
        });

        Crittercism.setUsername("user1234");
    };

    // complete the app setup in WinJS
    app.start();


    /* Namespace definitions */


    // this namespace is needed within the location search functionality
    // and referenced from the HTML as Search.perform() 
    // Not always necessary, but used to display an alternative to window(dot) for 
    // accessing global JS methods
    WinJS.Namespace.define("Search", {

        // the search button was tapped, perform it
        perform: function () {

            // reset the list
            window.locationResultList.splice(0, window.locationResultList.length);

            // get the search term
            var queryParam = document.getElementById('searchQuery').value;

            // set up our URL
            var baseURI = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.places%20where%20text%3D%22" + encodeURIComponent(queryParam) + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

            Crittercism.leaveBreadcrumb("Performing a search: " + queryParam);
            
            // execute the XHR request
            WinJS.xhr({
                type: "get",
                url: baseURI,
            }).then(function (r) {

                // upon completion, parse the JSON
                try {
                    var results = JSON.parse(r.responseText);

                    // extract the appropriate data
                    var places = results.query.results.place;

                    // grab the locations found during the search and update the
                    // locationResultList for display
                    for (var i = 0; i < places.length; i++) {
                        window.locationResultList.push(places[i]);
                    }

                    Crittercism.leaveBreadcrumb("Search completed: " + results.length + " results");

                } catch(e) {
                  Crittercism.logHandledException(e);
                }
            });

        }
    });

    /* Method Definitions */

    function saveLocation(e) {
        Crittercism.leaveBreadcrumb("Saving location");

        var loc = window.locationResultList.getAt(e.detail.itemIndex);
        window.locationList.push(loc);
        updateUI(loc);
    };

    function getLocation(locationID) {

        var index = 0;
        var item = window.locationList.getItem(index);

        while (item != null) {

            if (item.data.woeid == locationID) {
                return item.data;
            }

            item = window.locationList.getItem(++index);
        }

        return null;
    }


    function updateUI(location) {

        Crittercism.leaveBreadcrumb("User displaying location: " + location.woeid);

        //add remove tags
        document.getElementById("app").classList.add("show-location");
        document.getElementById("app").classList.remove("show-home");

        //update data
        document.body.querySelector(".loc-city").textContent = location.locality1.content;
        document.body.querySelector(".loc-state").textContent = location.admin1.content;
        document.body.querySelector(".loc-country").textContent = location.country.content;

        // load the data
        var baseURI = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D" + encodeURIComponent(location.woeid) + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
        WinJS.xhr({
            type: "get",
            url: baseURI,
        }).then(function (r) {

            Crittercism.leaveBreadcrumb("Location response loaded");

            try {            
                var results = JSON.parse(r.responseText);
                var data = results.query.results.channel;

                // do some quick data manipulation
                data.item.condition.imageSrc = 'http://l.yimg.com/a/i/us/we/52/' + data.item.condition.code + '.gif';

                window.currentForecast.splice(0, window.currentForecast.length);
                for (var i = 0; i < data.item.forecast.length; i++) {
                    var item = data.item.forecast[i];
                    item.icon = 'http://l.yimg.com/a/i/us/we/52/' + item.code + '.gif'
                    item.tempString = 'High: ' + item.high + " / Low: " + item.low;
                    window.currentForecast.push(item);
                }

                WinJS.Binding.processAll(document.getElementById("location-ui"), data);

                Crittercism.leaveBreadcrumb("Location UI loaded");

            } catch(e) {
              Crittercism.logHandledException(e);
            }

        });
    }

})();
