(function () {
    "use strict";

    var app = WinJS.Application;
    window.locationList = new WinJS.Binding.List([{ "lang": "en-US", "xmlns": "http://where.yahooapis.com/v1/schema.rng", "yahoo": "http://www.yahooapis.com/v1/base.rng", "uri": "http://where.yahooapis.com/v1/place/12770201", "woeid": "12770201", "placeTypeName": { "code": "11", "content": "Zip Code" }, "name": "29464", "country": { "code": "US", "type": "Country", "woeid": "23424977", "content": "United States" }, "admin1": { "code": "US-SC", "type": "State", "woeid": "2347599", "content": "South Carolina" }, "admin2": { "code": "", "type": "County", "woeid": "12589809", "content": "Charleston" }, "admin3": null, "locality1": { "type": "Town", "woeid": "2455374", "content": "Mount Pleasant" }, "locality2": null, "postal": { "type": "Zip Code", "woeid": "12770201", "content": "29464" }, "centroid": { "latitude": "32.823521", "longitude": "-79.856644" }, "boundingBox": { "southWest": { "latitude": "32.751732", "longitude": "-79.91687" }, "northEast": { "latitude": "32.88866", "longitude": "-79.80204" } }, "areaRank": "1", "popRank": "1", "timezone": { "type": "Time Zone", "woeid": "56043648", "content": "America/New_York" } }]);
    window.locationResultList = new WinJS.Binding.List([]);
    window.currentForecast = new WinJS.Binding.List([]);

    function saveLocation(e) {
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

    //SPLIT VIEW
    var mySplitView = window.mySplitView = {
        splitView: null,
        locationClicked: WinJS.UI.eventHandler(function (ev) {
            var locationID = ev.currentTarget.winControl.locationID;
            updateUI(getLocation(locationID));
        }),
        addLocationClicked: WinJS.UI.eventHandler(function (ev) {
            document.getElementById("app").classList.add("show-home");
            document.getElementById("app").classList.remove("show-trail");
        }),
    };
    //END SPLIT VIEW

    function updateUI(location) {

        //add remove tags
        document.getElementById("app").classList.add("show-trail");
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

            console.log(data);
        });
    }

    WinJS.Namespace.define("Search", {
        perform: function () {

            // reset the list
            window.locationResultList.splice(0, window.locationResultList.length);

            // TODO: show a loader

            var queryParam = document.getElementById('searchQuery').value;

            var baseURI = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.places%20where%20text%3D%22" + encodeURIComponent(queryParam) + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";
            WinJS.xhr({
                type: "get",
                url: baseURI,
            }).then(function (r) {
                var results = JSON.parse(r.responseText);
                var places = results.query.results.place;
                for (var i = 0; i < places.length; i++) {
                    window.locationResultList.push(places[i]);
                    console.log(places[i]);
                }
            });

        }
    });

    //processAll
    WinJS.UI.processAll().then(function () {

        document.querySelector('#basicListView').winControl.oniteminvoked = saveLocation;

        // document.getElementById('searchQuery').value = "charleston";
        // Search.perform();

        mySplitView.splitView = document.querySelector(".splitView").winControl;
        new WinJS.UI._WinKeyboard(mySplitView.splitView.paneElement);
    });

    app.start();

})();
