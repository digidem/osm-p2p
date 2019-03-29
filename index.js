var path = require('path')
var kappa = require('kappa-core')
var osmdb = require('kappa-osm')
var level = require('level')
var raf = require('random-access-file')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts }
  if (!opts) opts = {}
  var dir = opts.dir || path.resolve('./osm-p2p-kappa')

  var osm = osmdb({
    core: kappa(dir, {valueEncoding: 'json'}),
    index: level(path.join(dir, 'index')),
    storage: function (name, cb) {
      process.nextTick(cb, null, raf(path.join(dir, 'storage', name)))
    }
  })
  return osm
}
