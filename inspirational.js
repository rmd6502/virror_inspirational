Module.register("inspirational", {
    defaults: {
        url: "https://quotes.rest",
        category: "inspire",
        refreshTime: 1000,
        reloadTime: 3600000,
    },
    getStyles: function() {
        return [
            "inspirational.css"
        ]
    },
    start: function() {
        Log.log("config"+this.config)
        configuration = {
            url: this.config.url,
            apiKey: this.config.apiKey,
            category: this.config.category
        };
        if (this.config.endpoint) {
            configuration.endpoint = this.config.endpoint
        }
        this.sendSocketNotification("CONFIG", configuration);
        this.sendSocketNotification("FETCH");
    },
	getDom: function() {
        var container = document.createElement("div");
        var img;
        if (this.backgroundUrl) {
            img = document.createElement("img")
            img.src = this.backgroundUrl
            img.className = "background"

            container.appendChild(img)
        }
        var p = document.createElement("div")
        p.textContent = this.message;
        p.className = "saying"
        
        container.appendChild(p)
        var p2 = document.createElement("div")
        p2.textContent = this.author;
        p2.className = "author"

        container.appendChild(p2)
        this.lastUpdate = Date.now()
        return container
    },
    socketNotificationReceived: function(notification, payload) {
        Log.log("inspirational got notification "+notification+"::"+payload)
        if (notification === 'ERROR') {
            this.backgroundUrl = null;
            this.message = payload;
            this.author = null;
            this.updateDom(0);
        } else if (notification === 'BGIMAGES') {
            Log.log("received bgimages "+payload)
            this.backgroundImages = payload.images;
        } else {
            if (payload.background) {
                this.backgroundUrl = payload.background;
            } else if (this.backgroundImages && this.backgroundImages.length > 0) {
                var imageNum = Math.floor(Math.random() * this.backgroundImages.length)
                this.backgroundUrl = "/" + this.name + "/images/" + this.backgroundImages[imageNum]
                Log.log("background URL "+this.backgroundUrl)
            }
            this.message = payload.quote;
            this.author = payload.author;
            this.updateDom(this.config.refreshTime);
        }
    },
    notificationReceived: function(notification, payload, sender) {
        if (notification == "CLOCK_SECOND") {
            if (this.lastUpdate && Date.now() - this.lastUpdate >= this.config.reloadTime) {
                Log.log("Refreshing")
                this.sendSocketNotification("FETCH");
            }
        }
    },
});
