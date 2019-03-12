var path = require('path')
var mkdirp = require('mkdirp')
var kappa = require('kappa-core')
var osmdb = require('kappa-osm')
var LevelUp = require('levelup')
var leveldown = require('leveldown')
var once = require('once')
var Deflevel = require('deferred-leveldown')
var raf = require('random-access-file')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts }
  if (!opts) opts = {}
  var dir = opts.dir || path.resolve('./osm-p2p-kappa')

  var defIndexDB = new Deflevel()
  var index = levelup(defIndexDB)

  mkdirp(dir, function (err) {
    if (err) osm.emit('error', err)

    var indexDown = leveldown(path.join(dir, 'index'))
    indexDown.open(function (err) {
      if (err) osm.emit('error', err)
      else defIndexDB.setDb(indexDown)
    })

    index.close = function (cb) {
      cb = once(cb || noop)
      var pending = 2
      indexDown.close(onclose)
      function onclose (err) {
        if (err) cb(err)
        else if (--pending === 0) cb(null)
      }
    }
  })

  var osm = osmdb({
    core: kappa(dir, {valueEncoding: 'json'}),
    index: index,
    storage: raf
  })
  return osm
}

function levelup (down) {
  return new LevelUp({ db: function () { return down } })
}
function noop () {}
