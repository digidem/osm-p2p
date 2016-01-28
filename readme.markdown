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

output:

```
$ node osm.js create '{"id":"A","lat":64.5,"lon":-147.6}'
d5b32ade3a052bb2
$ node osm.js create '{"id":"B","lat":62.9,"lon":-146.1}'
8594030e41faf93c
$ node osm.js create '{"id":"C","lat":65.5,"lon":-148.2}'
eb8206fe16e4d8d8
$ node osm.js query 61,65 -149,-147
{ id: 'd5b32ade3a052bb2',
  lat: 64.5,
  lon: -147.6,
  version: '6732d1580bc07c9ab4d07c56025825998a0741f528e4cd2b48c1fdbfb26389b2' }
```

# browser example
