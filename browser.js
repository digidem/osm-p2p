var hyperlog = require('hyperlog')
var idbstore = require('idb-chunk-store')
var osmdb = require('osm-p2p-db')
var level = require('level-browserify')

module.exports = function (opts) {
  if (!opts) opts = {}
  var logdb = level(opts.logName || 'log')
  var log = hyperlog(logdb, { valueEncoding: 'json' })
  return osmdb({
    log: log,
    db: level(opts.indexName || 'index'),
    store: idbStore(opts.chunkSize || 4096)
  })
}
