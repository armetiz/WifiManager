Freeboxes = new Meteor.Collection("freeboxes");

Application = {
    HOURS_MASK:[],
    isHourEnabled: function (hoursEnabled, hour) {
        return (0 !== (hoursEnabled & Application.HOURS_MASK[hour]));
    }
}

for (var i = 0 ; i < 24 ; i++) {
    Application.HOURS_MASK.push(1 << i);
}

// Check is hoursEnabled contain an enabled hour


Freeboxes.allow({
  insert: function (userId, freebox) {
    return false; // no cowboy inserts -- use createFreebox method
  },
  update: function (userId, freebox, fields, modifier) {
    if (userId !== freebox.owner) {
      return false; // not the owner  
    }
    return true;
  },
  remove: function (userId, freebox) {
    // You can only remove parties that you created and nobody is going to.
    return freebox.owner === userId;
  }
});

Meteor.methods({
    addFreebox: function(options) {
        options = options || {};
        
        if (! this.userId) {
            throw new Meteor.Error(403, "You must be logged in");
        }
        
        if(!_.has(options, 'title') && '' !== options['title']) {
            throw new Meteor.Error(400, "Required parameter missing: 'title'");
        }
        
        if(!_.has(options, 'hostname') && '' !== options['title']) {
            throw new Meteor.Error(400, "Required parameter missing: 'hostname'");
        }
        
        if(!_.has(options, 'password') && '' !== options['password']) {
            throw new Meteor.Error(400, "Required parameter missing: 'password'");
        }
        
        if(!_.has(options, 'timezone') && '' !== options['timezone']) {
            options.timezone = 'Europe/Paris';
        }
        
        return Freeboxes.insert({
            owner: this.userId,
            title: options.title,
            hostname: options.hostname,
            password: options.password,
            timezone: options.timezone,
            port: options.port,
            wifi: false,
            hoursEnabled: 0,
            connected: false
        });
    }
});
