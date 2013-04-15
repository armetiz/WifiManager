var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');
var BoxManager = {
    _setWifi: function(freebox, wifi) {
        Fiber(function() {
            Freeboxes.update(freebox._id, {$set: {wifi: wifi, connected: true}});
        }).run();
    },
    _error: function(freebox, message) {
        Fiber(function() {
            Freeboxes.update(freebox._id, {$set: {wifi: false, connected: false, latestError: message}});
        }).run();
    },
    _getFreeboxConnection: function(freebox) {
        if(!_.has(freebox, 'password')) {
            //client freebox model doesn't contains password field. Just refresh from server-side
            freebox = Freeboxes.findOne(freebox);
        }
        
        var freeboxConnection = new Freebox({
            password: freebox.password,
            hostname: freebox.hostname,
            port: freebox.port
        });
        
        return freeboxConnection;
    },
    toggleConnection: function(freebox) {
        var freeboxConnection = BoxManager._getFreeboxConnection(freebox);
        
        freeboxConnection.on('connect', function() {
            freeboxConnection.wifiStatus(function (status) {
                if(status.active) {
                    freeboxConnection.wifiOff(function (result) {
                        BoxManager._setWifi(freebox, true);
                    });
                }
                else {
                    freeboxConnection.wifiOn(function (result) {
                        BoxManager._setWifi(freebox, false);
                    });
                }
                
            });
        });
        freeboxConnection.on('error', function(message) {
            BoxManager._error(freebox, message);
        });

        freeboxConnection.connect();
    },
    checkConnection: function(freebox) {
        var freeboxConnection = BoxManager._getFreeboxConnection(freebox);

        freeboxConnection.on('connect', function() {
            freeboxConnection.wifiStatus(function (status) {
                BoxManager._setWifi(freebox, status.active);
            });
        });

        freeboxConnection.on('error', function(message) {
            BoxManager._error(freebox, message);
        });

        freeboxConnection.connect();
    },
    checkConnectionsToToggle: function() {
        _.each(BoxManager.getConnectionsToToggle(), BoxManager.toggleConnection);
    },
    getConnectionsToToggle: function() {
        return _.filter(Freeboxes.find().fetch(), function(freebox) {
            return freebox.wifi !== Application.isHourEnabled(freebox.hoursEnabled, (new Date()).setTimezone(freebox.timezone).getHours());
        });
    }
};

Meteor.publish("freeboxes", function () {
    return Freeboxes.find({owner: this.userId}, {fields: {password: 0}});
});

Meteor.setInterval(function() {
    var freeboxes = Freeboxes.find().fetch();
    _.each(freeboxes, BoxManager.checkConnection);
}, 2000);

Meteor.setInterval(BoxManager.checkConnectionsToToggle, 10000);

Meteor.methods({
    toggleConnection: function(freebox) {
        BoxManager.toggleConnection(freebox);
    },
    getDate: function(freebox) {
        return new Date();
    },
    getHour: function(freebox) {
        return (new Date()).getUTCHours();
    },
    getConnectionsToToggle: function() {
        return BoxManager.getConnectionsToToggle();
    },
    getFreeboxes: function() {
        return Freeboxes.find().fetch();
    },
    getUnderscoreVersion: function() {
        return _.VERSION;
    }
});
