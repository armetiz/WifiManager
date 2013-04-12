Meteor.subscribe("freeboxes");

Session.setDefault('enabled-hours', parseInt(0, 2));

Template.freeboxes.events({
    'click .freebox input[name="schedule"]' : function(e) {
        if(Session.get('selected-freebox')) {
            Session.set('selected-freebox', null);
        }
        else {
            Session.set('selected-freebox', this);
        }
    },
    'click .freebox input[name="delete"]' : function(e) {
        Freeboxes.remove(this._id);
    },
    'click .freebox input[name="toggle"]' : function() {
        Meteor.call('toggleConnection', this);
    },
    'click .scheduler .hour': function(e) {
        var hourButton = jQuery(e.currentTarget);
        var freebox = Freeboxes.findOne(Session.get('selected-freebox')._id);
        var hoursEnabled = freebox.hoursEnabled;
        var hourSelected = hourButton.data('hour');
        
        if(isHourEnabled(hoursEnabled, hourSelected)) {
            hoursEnabled -= HOURS_MASK[hourButton.data('hour')];
        }
        else {
            hoursEnabled += HOURS_MASK[hourButton.data('hour')];
        }
        
        Freeboxes.update(freebox._id, {$set: {hoursEnabled: hoursEnabled}});
    }
});

Template.form.events({
    'click input[name="add"]': function () {
        var options = {
            title: jQuery('input[name="title"]').val(),
            hostname: jQuery('input[name="hostname"]').val(),
            password: jQuery('input[name="password"]').val()
        };
        Meteor.call('addFreebox', options);
    }
});

Template.freeboxes.freeboxes = function () {
    return Freeboxes.find();
};

Template.freeboxes.helpers({
    selectedFreebox: function() {
        return Session.get('selected-freebox');
    },
    classButtonHour: function(enabled) {
        if(enabled) {
            return 'btn-success';
        }
        else {
            return 'btn-inverse';
        }
    },
    hours: function() {
        var hours = [];
        var freebox = Freeboxes.findOne(Session.get('selected-freebox')._id);
        
        _.each(HOURS_MASK, function(value, key) {
            hours.push({
                hour: key,
                enabled: isHourEnabled(freebox.hoursEnabled, key)
            });
        });
        
        return hours;
    }
});