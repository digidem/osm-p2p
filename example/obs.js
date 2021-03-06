var osmdb = require('../')
var osm = osmdb('/tmp/osmdb')
var join = require('hyperlog-join')
var sub = require('subleveldown')
var once = require('once')

var indexes = {}
indexes.ref = join({
  log: osm.log,
  db: sub(osm.db, 'ix-ref'),
  map: function (row) {
    var v = row.value && row.value.v
    if (!v || v.type !== 'observation' || !v.ref) return
    return { type: 'put', key: v.ref, value: 0 }
  }
})
indexes.time = join({
  log: osm.log,
  db: sub(osm.db, 'ix-refs'),
  map: function (row) {
    var v = row.value && row.value.v
    if (!v || v.type !== 'observation' || !v.time) return
    return { type: 'put', key: TIME + v.time, value: 0 }
  }
})

if (process.argv[2] === 'create') {
  var value = JSON.parse(process.argv[3])
  osm.create(value, function (err, key, node) {
    if (err) console.error(err)
    else console.log(key)
  })
} else if (process.argv[2] === 'query') {
  var q = process.argv.slice(3).map(csplit)
  osm.query(q, function (err, pts) {
    if (err) return console.error(err)
    pts.forEach(function (pt) {
      indexes.ref.list(pt.id, function (err, results) {
        if (err) return console.error(err)
        augment(pt, results, function (err, pt) {
          if (err) console.error(err)
          else console.log(pt)
        })
      })
    })
  })
}

function csplit (x) { return x.split(',').map(Number) }
function augment (pt, results, cb) {
  cb = once(cb)
  var pending = results.length
  pt.observations = []
  results.forEach(function (r) {
    osm.log.get(r.key, function (err, doc) {
      if (err) return cb(err)
      pt.observations.push(doc.value.v)
      if (--pending === 0) cb(null, pt)
    })
  })
}
