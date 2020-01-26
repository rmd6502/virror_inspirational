var NodeHelper = require("node_helper");
var request = require("request");
const oneDay = 24 * 3600 * 1000;

module.exports = NodeHelper.create({
    start: function() {
        this.url = "https://quotes.rest";
        this.endpoint = "qod";
        this.category = null;
        this.apiKey = "";
    },
    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.url = payload.url;
            if (payload.category) {
                this.category = payload.category;
            }
            if (payload.apiKey) {
                this.apiKey = payload.apiKey;
            }
            if (payload.endpoint) {
                this.endpoint = payload.endpoint;
            }
        } else if (notification == "FETCH") {
            if (!this.qotdCache || !this.cacheDate || this.cacheDate - Date.now() > oneDay) {
                console.log("no cache - fetching result")
                this.fetchQotd();
            } else {
                console.log("sending cache")
                this.sendResult();
            }
        }
    },
    fetchQotd: function() {
        console.log("apikey "+this.apiKey)
        request({
            url: this.url + "/" + this.endpoint + (this.category ? "?category="+this.category : ""),
            headers: {
                'X-TheySaidSo-Api-Secret': this.apiKey,
                'Accept': 'application/json'
            }
        }, (reason, resp, body) => {
            if (reason) {
                this.sendError(reason);
            } else if (resp.statusCode != 200) {
                this.sendError(body)
            } else {
                var result = JSON.parse(body);
                if (result.success && result.contents.quotes && result.contents.quotes.length > 0) {
                    this.qotdCache = result.contents.quotes[0];
                    this.cacheDate = new Date(result.contents.quotes[0].date);
                    this.sendResult()
                } else {
                    console.log("no data "+result.contents)
                    this.sendError("no data received");
                }
            }
        })
    },
    sendError: function(reason) {
        this.sendSocketNotification("ERROR", reason);
    },
    sendResult: function() {
        this.sendSocketNotification("RESULT", this.qotdCache);
    }
});
