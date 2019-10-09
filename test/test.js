var osmdb = require('..')
var test = require('tape')
var tmp = require('tmp')

test('creation', function (t) {
  t.plan(1)

  var dir = tmp.dirSync().name

  var osm = osmdb(dir)
  osm.ready(function () {
    t.ok(true)
  })
})
