module.exports = function(path, callback) {
  // tests that the `require()` calls work asynchronously
  // without having to edit `require.cache`
  process.nextTick(function() {
    callback(null, require(path));
  });
};
