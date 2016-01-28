# osm-p2p

create an [osm-p2p-db][1] with reasonable defaults
for node and the browser

[1]: https://github.com/digidem/osm-p2p-db

# node example

In node, give `osm-p2p` a directory to store its files:

``` js
var osmdb = require('osm-p2p')
var osm = osmdb('/tmp/osmdb')

if (process.argv[2] === 'create') {
  var value = JSON.parse(process.argv[3])
  osm.create(value, function (err, key, node) {
    if (err) console.error(err)
    else console.log(key)
  })
} else if (process.argv[2] === 'query') {
  var q = process.argv.slice(3).map(csplit)
  osm.query(q, function (err, pts) {
    if (err) console.error(err)
    else pts.forEach(function (pt) {
      console.log(pt)
    })
  })
}

function csplit (x) { return x.split(',').map(Number) }
```

# browser example
