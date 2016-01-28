var osmdb = require('../../')
var osm = osmdb()

document.querySelector('form#add').addEventListener('submit', onadd)
document.querySelector('form#query').addEventListener('submit', onquery)

function onadd (ev) {
  var form = this
  ev.preventDefault()
  var doc = {
    lat: this.elements.lat.value,
    lon: this.elements.lon.value
  }
  osm.create(doc, function (err, key, node) {
    if (err) console.error(err)
    else form.reset()
  })
}

function onquery (ev) {
  ev.preventDefault()
  var q = [
    [ this.elements.minlat.value, this.elements.maxlat.value ],
    [ this.elements.minlon.value, this.elements.maxlon.value ]
  ]
  osm.query(q, function (err, results) {
    document.querySelector('#query-results').innerText
      = results.map(str).join('\n')
    function str (row) { return JSON.stringify(row) }
  })
}
