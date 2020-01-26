var NodeHelper = require("node_helper");
var request = require("request");
const fs = require('fs');

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
            this.sendImages();
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
        const url = this.url + "/" + this.endpoint + (this.category && this.category.length ? "?category="+this.category : "")
        console.log("url "+url)
        request({
            url: url,
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
                } else if (result.success && result.contents.quote) {
                    this.qotdCache = result.contents
                    this.cacheDate = new Date();
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
    },
    sendImages: function() {
        const path = this.path+"/public/images"
        console.log("path "+path)
        fs.readdir(path, (err,dir) => {
            if (err) {
                console.err("Failed to open "+path)
            } else if (!dir || !dir.length) {
                console.err("Didn't fail to open "+path+", but dir is not set")
            } else {
                var ret = [];
                for (var ent of dir) {
                    const idx = ent.lastIndexOf(".")
                    if (idx == -1) continue;
                    const ext = ent.toLowerCase().substr(idx + 1)
                    if (["jpg","png","jpeg","tiff"].indexOf(ext) != -1) {
                        ret.push(ent)
                    }
                }
                if (ret.length > 0) {
                    this.sendSocketNotification("BGIMAGES", {images: ret})
                }
            }
        })
    },
});
