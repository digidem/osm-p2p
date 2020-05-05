var path = require('path')
var kappa = require('kappa-core')
var osmdb = require('kappa-osm')
var level = require('level')
var raf = require('random-access-file')
var mkdirp = require('mkdirp')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts }
  if (!opts) opts = {}
  var dir = opts.dir || path.resolve('./osm-p2p-kappa')

  mkdirp.sync(path.join(dir, 'index'))
  mkdirp.sync(path.join(dir, 'storage'))

  var core = kappa(dir, {valueEncoding: 'json', encryptionKey: opts.encryptionKey})
  var _storage = raf(path.join(dir, 'storage', name))
  var storage = function (name, cb) {
    process.nextTick(cb, null, _storage)
  }
  var index = level(path.join(dir, 'index'))

  var osm = osmdb({ core, index, storage })
	
  osm.close = (cb) => {
    var pending = 2 
    _storage.close(done)
    index.close(done)

    function done() {
      if (--pending) return
      if (cb) cb()
    }
  }
  return osm
}
