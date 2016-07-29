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
15398698684854381490
$ node osm.js create '{"id":"B","lat":62.9,"lon":-146.1}'
9625321663368984892
$ node osm.js create '{"id":"C","lat":65.5,"lon":-148.2}'
16970134034261006552
$ node osm.js query 61,65 -149,-147
{ id: '15398698684854381490',
  lat: 64.5,
  lon: -147.6,
  version: '6732d1580bc07c9ab4d07c56025825998a0741f528e4cd2b48c1fdbfb26389b2' }
```

# browser example

In this example, we can add points and query the points we've added.
The point data persists using IndexedDB, a native browser API.

``` js
var osmdb = require('osm-p2p')
var osm = osmdb()

document.querySelector('form#add').addEventListener('submit', onadd)
document.querySelector('form#query').addEventListener('submit', onquery)

function onadd (ev) {
  var form = this
  ev.preventDefault()
  var doc = {
    type: 'node',
    lat: Number(this.elements.lat.value),
    lon: Number(this.elements.lon.value)
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
```

To generate a blob of javascript, run browserify on this `main.js` file:

```
$ browserify main.js > bundle.js
```

And put `<script src="bundle.js"></script>` into your html.
See the `example/browser` directory for the rest of this example.

# api

``` js
var osmdb = require('osm-p2p')
```

## var osm = osmdb(opts)

Create an open street maps database in node or the browser.

* `opts.dir` - the directory to use to store the data files (required in node)
* `opts.chunkSize` - the chunk size to use for the kdb tree

If `opts` is a string, it is interpreted as the `opts.dir`.

## osm.create(doc, opts={}, cb)

Create a new document `doc` to store in the database.

`cb(err, id, node)` fires with an error `err` or the node `id` and `node` from
the underlying hyperlog.

`doc` must have:

* `doc.type` - either `'node'`, `'way'`, `'relation'` or `'changeset'`

Nodes must have:

* `doc.changeset` - the changeset id of this update
* `doc.lat` - latitude in degrees
* `doc.lon` - longitude in degrees

Ways must have:

* `doc.refs` - an array of string IDs that are contained in the way

Relations must have:

* `doc.members` - an array of objects with a `member.type` with the type of the
document pointed at by `member.ref` and an optional [`member.role`][5]

Changesets should have:

* `doc.tags.comment` - a string describing the changes, like a commit message

All documents can have:

* `doc.tags` - an object with additional document metadata

[5]: http://wiki.openstreetmap.org/wiki/Relation#Roles

## osm.put(id, doc, opts={}, cb)

Replace a document at `id` with `doc`. If there is no document at `id`, it will
be created.

The document `doc` should be structured according to the outline in the
`osm.create()` section.

If `opts.links` is set, it will refer to an array of document hashes that the
current document intends to replace. Otherwise, the most recent hashes known
locally for the `id` are used.

## osm.get(id, opts={}, cb)

Get a document as `cb(err, docs)` by its OSM `id`.

The `docs` will map version hash keys to document body values.

Most of the time, there will be a single document in `docs`, but when multiple
people are editing the same document offline and replicating, there could be
more than one document.

## var stream = osm.kv.createReadStream(opts)

Get a list of all the IDs and values in the database.

`stream` is an object stream and each `row` object has:

* `row.key` - the ID of the document
* `row.links` - an array of current hashes that point at the key
* `row.values` - an object mapping current hashes to document values

When a document has multiple forks of the "current" values, the `row.links`
array will have more than one element and the `row.values` will have more than
one key.

## osm.query(q, opts={}, cb)

Query for all nodes, ways, and relations in the bounding box query given by `q`.
The query `q` is an array of `[[minLat,maxLat],[minLon,maxLon]]`.

`cb(err, results)` fires with an array of `results`, which are the documents
values plus a `version` property that is the hash from the underlying hyperlog.

Optionally:

* `opts.order` - set to `'type'` to order by type: node, way, relation

## var rstream = osm.queryStream(q, opts)

Query for all nodes, ways, and relations in the bounding box query given by `q`.
The query `q` is an array of `[[minLat,maxLat],[minLon,maxLon]]`.

The query results are provided by a readable stream `rstream`. Each object is a
document from the database with a `version` property that is the hash of the
document from the underlying hyperlog.

## var rstream = osm.getChanges(id, cb)

Given a changeset `id`, get a list of document IDs in the changeset either as
`cb(err, ids)` or in the readable stream `rstream` where each object in the
output is a string id.

## var stream = osm.log.replicate()

Return a duplex stream that can be used to replicate two osmdb instances.
With a duplex stream, you will need to hook up both the readable and writable
ends of the connection with `.pipe()`.

For example, to replicate two databases over a tcp connection, one process will
have a server:

``` js
var osmdb = require('osm-p2p')
var osm = osmdb()

var net = require('net')
var server = net.createServer(function (stream) {
  stream.pipe(osm.log.replicate()).pipe(stream)
})
server.listen(5000)
```

and a client:

``` js
var osmdb = require('osm-p2p')
var osm = osmdb()

var net = require('net')
var stream = net.connect('localhost', 5000)
stream.pipe(osm.log.replicate()).pipe(stream)
```

Any streaming transport will work. For example, you can use
[websocket-stream][2] to replicate a browser database to a server and vice-versa
or [simple-peer][3] to connect two browsers together directly without going
through a server at all.

[2]: https://npmjs.com/package/websocket-stream
[3]: https://npmjs.com/package/simple-peer

# forks

Sometimes, a key will point at more than one document. This is a normal and
expected state for a highly distributed, highly offline peer to peer database.

These are sometimes called "conflicts" in databases, but here they are a natural
state of the database and can be reconciled at any future time when it is
convenient to merge them into a single (or simply fewer) document(s).

Having multiple forks is not a show-stopping event. Replication will still work
and the forks can be individually edited, similarly to branches in git.

# architecture

To learn more about the architecture of the suite of libraries that power
osm-p2p, check out [architecture.markdown][4].

[4]: https://github.com/digidem/osm-p2p-db/blob/master/doc/architecture.markdown

# install

```
npm install osm-p2p
```

# license

BSD
