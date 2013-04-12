var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');
var BoxManager = {
    toggleConnection: function(freebox) {
        if(!_.has(freebox, 'password')) {
            //client freebox model doesn't contains password field. Just refresh from server-side
            freebox = Freeboxes.findOne(freebox);
        }
        
        var freeboxCnx = new Freebox({
            password: freebox.password,
            hostname: freebox.hostname
        });

        freeboxCnx.on('connect', function() {
            freeboxCnx.wifiStatus(function (status) {
                if(status.active) {
                    freeboxCnx.wifiOff(function (result) {
                        BoxManager._setWifi(freebox, true);
                    });
                }
                else {
                    freeboxCnx.wifiOn(function (result) {
                        BoxManager._setWifi(freebox, false);
                    });
                }
                
            });
        });
        freeboxCnx.on('error', function(message) {
            BoxManager._error(freebox);
        });

        freeboxCnx.connect();
    },
    _setWifi: function(freebox, wifi) {
        Fiber(function() {
            Freeboxes.update(freebox._id, {$set: {wifi: wifi, connected: true}});
        }).run();
    },
    _error: function(freebox) {
        Fiber(function() {
            Freeboxes.update(freebox._id, {$set: {wifi: false, connected: false}});
        }).run();
    },
    checkConnection: function(freebox) {
        if(!_.has(freebox, 'password')) {
            //client freebox model doesn't contains password field. Just refresh from server-side
            freebox = Freeboxes.findOne(freebox);
        }
        
        var freeboxCnx = new Freebox({
            password: freebox.password,
            hostname: freebox.hostname
        });

        freeboxCnx.on('connect', function() {
            freeboxCnx.wifiStatus(function (status) {
                BoxManager._setWifi(freebox, status.active);
            });
        });

        freeboxCnx.on('error', function(message) {
            BoxManager._error(freebox);
        });

        freeboxCnx.connect();
    },
    checkConnections: function() {
        var currentHour = (new Date()).getHours();
        var freeboxesToToggle = _.filter(Freeboxes.find().fetch(), function(freebox) {
            return freebox.wifi !== Application.isHourEnabled(freebox.hoursEnabled, currentHour);
        });
        
        _.each(freeboxesToToggle, BoxManager.toggleConnection);
        
        if(freeboxesToToggle.length() > 0)
            console.log(freeboxesToToggle);
    }
};

Meteor.publish("freeboxes", function () {
    return Freeboxes.find({owner: this.userId}, {fields: {password: 0}});
});

Meteor.setInterval(function() {
    var freeboxes = Freeboxes.find().fetch();
    _.each(freeboxes, BoxManager.checkConnection);
}, 2000);

Meteor.setInterval(BoxManager.checkConnections, 10000);

Meteor.methods({
    toggleConnection: function(freebox) {
        BoxManager.toggleConnection(freebox);
    }
});
