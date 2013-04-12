Freeboxes = new Meteor.Collection("freeboxes");

Application = {
    HOURS_MASK:[],
    isHourEnabled: function (hoursMask, hour) {
        return (0 !== (hoursMask & Application.HOURS_MASK[hour]));
    }
}

for (var i = 0 ; i < 24 ; i++) {
    Application.HOURS_MASK.push(1 << i);
}

// Check is hoursMask contain an enabled hour


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
        
        return Freeboxes.insert({
            owner: this.userId,
            title: options.title,
            hostname: options.hostname,
            password: options.password,
            wifi: false,
            hoursEnabled: 0
        });
    }
});