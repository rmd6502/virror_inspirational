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
        Log.log("notification "+notification+"::"+payload)
        if (notification == 'ERROR') {
            this.backgroundUrl = null;
            this.message = payload;
            this.author = null;
            this.updateDom(0);
        } else {
            this.backgroundUrl = payload.background;
            this.message = payload.quote;
            this.author = payload.author;
            this.updateDom(this.config.refreshTime);
        }
    },
    notificationReceived: function(notification, payload, sender) {
        if (notification == "CLOCK_SECOND") {
            if (this.lastUpdate && Date.now() - this.lastUpdate >= this.config.reloadTime) {
                this.sendSocketNotification("FETCH");
            }
        }
    },
});
