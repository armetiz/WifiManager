Meteor.subscribe("freeboxes");

Session.setDefault('enabled-hours', parseInt(0, 2));
Session.setDefault('selected-freebox', null);

Template.freeboxes.events({
    'click .freebox input[name="schedule"]' : function(e) {
        if(Session.get('selected-freebox') && this._id === Session.get('selected-freebox')._id) {
            Session.set('selected-freebox', null);
        }
        else {
            Session.set('selected-freebox', this);
        }
    },
    'click .freebox input[name="delete"]' : function(e) {
        Session.set('selected-freebox', null);
        Freeboxes.remove(this._id);
    },
    'click .freebox input[name="toggle"]' : function() {
        Meteor.call('toggleConnection', this);
    },
    'click .scheduler .hour': function(e) {
        var hourButton = jQuery(e.currentTarget);
        var freebox = Freeboxes.findOne(Session.get('selected-freebox')._id);   //get fresh version
        var hoursEnabled = freebox.hoursEnabled;
        var hourSelected = hourButton.data('hour');
        
        if(Application.isHourEnabled(hoursEnabled, hourSelected)) {
            hoursEnabled -= Application.HOURS_MASK[hourSelected];
        }
        else {
            hoursEnabled += Application.HOURS_MASK[hourSelected];
        }
        
        Freeboxes.update(freebox._id, {$set: {hoursEnabled: hoursEnabled}});
    }
});

Template.form.events({
    'click input[name="add"]': function () {
        var options = {
            title: jQuery('input[name="title"]').val(),
            hostname: jQuery('input[name="hostname"]').val(),
            port: jQuery('input[name="port"]').val(),
            password: jQuery('input[name="password"]').val(),
            timezone: jQuery('input[name="timezone"]').val()
        };
        Meteor.call('addFreebox', options);
    }
});

Template.freeboxes.freeboxes = function () {
    return Freeboxes.find();
};

Template.freeboxes.freeboxError = function () {
    return Freeboxes.find({owner: Meteor.userId, connected: false}, {fields: {_id: 1}}).count() > 0
}

Template.freeboxes.selectedFreebox = function() {
    return Session.get('selected-freebox');
}

Template.freeboxes.helpers({
    freeboxError: function () {
        return Freeboxes.find({owner: Meteor.userId(), connected: false}, {fields: {_id: 1}}).count();
    },
    classButtonHour: function(enabled) {
        if(enabled) {
            return 'btn-success';
        }
        else {
            return 'btn-inverse';
        }
    },
    classFreebox: function(freebox) {
        if(!freebox.connected) {
            return 'error';
        }
        
        if(freebox.wifi) {
            return 'success';
        }
        else {
            return 'warning';
        }
    },
    hours: function() {
        var hours = [];
        var freebox = Freeboxes.findOne(Session.get('selected-freebox')._id);
        
        _.each(Application.HOURS_MASK, function(value, key) {
            hours.push({
                hour: key,
                enabled: Application.isHourEnabled(freebox.hoursEnabled, key)
            });
        });
        
        return hours;
    }
});
