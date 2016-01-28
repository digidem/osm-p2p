var hyperlog = require('hyperlog')
var fdstore = require('fd-chunk-store')
var path = require('path')
var mkdirp = require('mkdirp')
var osmdb = require('osm-p2p-db')

var LevelUp = require('levelup')
var leveldown = require('leveldown')
var deflevel = require('deferred-leveldown')
var deferredStore = require('deferred-chunk-store')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts }
  if (!opts) opts = {}
  var dir = opts.dir || path.resolve('./osm-p2p-data')
  var defIndexDB = new deflevel()
  var defLogDB = new deflevel()

  var log = hyperlog(levelup(defLogDB), { valueEncoding: 'json' })
  var chunkSize = opts.chunkSize || 4096
  var defStore = deferredStore(chunkSize)

  mkdirp(dir, function (err) {
    if (err) osm.emit('error', err)
    var store = fdstore(chunkSize, path.join(dir, 'kdb'))
    defStore.setStore(store)
    defIndexDB.setDb(leveldown(path.join(dir, 'index')))
    defLogDB.setDb(leveldown(path.join(dir, 'log')))
  })
  return osmdb({
    log: log,
    db: levelup(defIndexDB),
    store: defStore
  })
}

function levelup (down) {
  return new LevelUp({ db: function () { return down } })
}
