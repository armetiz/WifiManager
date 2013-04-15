// file: package.js
Npm.depends({
    'time': '0.9.2'
});

Package.on_use(function(api) {
    api.add_files('time.js', 'server');
});
