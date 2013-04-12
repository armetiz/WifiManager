// file: freebox-sdk.js
Freebox = Npm.require("freebox-sdk");
freeboxFacade = {
  get: function(options) {
    return new Freebox(options);
  }
};
