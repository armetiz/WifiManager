// file: package.js
Npm.depends({
    'freebox-sdk': '0.3.0'
});

Package.on_use(function(api) {
    api.add_files('freebox-sdk.js', 'server');
});
