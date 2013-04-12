var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');

var checkConnection = function(freebox) {
    var freeboxCnx = new Freebox({
        password: freebox.password,
        hostname: freebox.hostname
    });
    
    freeboxCnx.on('connect', function() {
        freeboxCnx.wifiStatus(function (status) {
            Fiber(function() {
                Freeboxes.update(freebox._id, {$set: {wifi: status.active, connected: true}});
            }).run();
        });
    });

    freeboxCnx.on('error', function(message) {
        Fiber(function() {
            Freeboxes.update(freebox._id, {$set: {wifi: false, connected: false}});
        }).run();
    });

    freeboxCnx.connect();
}

var checkConnections = function() {
    var freeboxes = Freeboxes.find({}).fetch();
    _.each(freeboxes, checkConnection);
};

Meteor.publish("freeboxes", function () {
    return Freeboxes.find({owner: this.userId}, {fields: {password: 0}});
});

Meteor.setInterval(checkConnections, 2000);

Meteor.methods({
    toggleConnection: function(freebox) {
        //client freebox model doesn't contains password field. Just refresh from server-side
        freebox = Freeboxes.findOne(freebox);
        
        var freeboxCnx = new Freebox({
            password: freebox.password,
            hostname: freebox.hostname
        });

        freeboxCnx.on('connect', function() {
            freeboxCnx.wifiStatus(function (status) {
                if(status.active) {
                    freeboxCnx.wifiOff(function (result) {
                        Fiber(function() {
                            Freeboxes.update(freebox._id, {$set: {wifi: false, connected: true}});
                        }).run();
                    });
                }
                else {
                    freeboxCnx.wifiOn(function (result) {
                        Fiber(function() {
                            Freeboxes.update(freebox._id, {$set: {wifi: true, connected: true}});
                        }).run();
                    });
                }
                
            });
        });

        freeboxCnx.on('error', function(message) {
            Fiber(function() {
                Freeboxes.update(freebox._id, {$set: {connected: false}});
            }).run();
        });

        freeboxCnx.connect();
    }
});
