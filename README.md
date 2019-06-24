# Linked Connections Cluster
Web server that exposes spatiotemporal fragmented [Linked Connections](https://linkedconnections.org/). Based on [Linked Connections Server](https://github.com/julianrojas87/linked-connections-server) and requires one or more Linked Connections servers as data source.

## Installation
Requires [Node](https://nodejs.org/) 10.x or higher.

```bash
$ git clone https://github.com/Buccaneer/lc-cluster.git
$ cd lc-cluster
$ npm install
```

## Configuration

- **host:** Web Server host name.
- **port:** TCP/IP port that exposes the server.
- **path:** Path where all data are kept (best to use an empty directory).
- **startTime:** ISO Datetime, only connections that depart after this time are fetched.
- **stopTime:** ISO Datetime, only connections that depart before this time are fetched.
- **agencies:** Array of all agencies whose Linked Connections are to be fragmented and hosted.
    - **name:** Name of agency: data for every agency is kept in `/path/name`, do not use characters incompatible with OS directory names.
    - **clusters:** Defines the amount of clusters in which connections are fragmented.
    - **stopUrls:** URLs to LC Server endpoints where stops are hosted.
    - **connectionsUrls:** URLs to LC Server endpoints where connections are hosted.


```js
{
    host: 'localhost:3000',
    port: 3000,
    path: '/path/to/files',
    startTime: '2019-05-15T00:00:00.000Z',
    stopTime: '2019-05-17T00:00:00.000Z',
    agencies: [
        {
            name: 'delijn',
            clusters: 50,
            stopUrls: [
                'https://openplanner.ilabt.imec.be/delijn/Antwerpen/stops', 
                ... 
            ],
            connectionUrls: [
                'https://openplanner.ilabt.imec.be/delijn/Antwerpen/connections', 
                ... 
            ]
        }
    ]
}
```

## Run
First all necessary data must be fetched and processed. Following methods are available in `fragmenter.js` and must be run in order.
- **createAllStops():** Fetches stops and keeps them in `/path/agency/stops.json`.
- **createAllSortedConnections():** Fetches connections and sorts them chronologically by departureTime in `/path/agency/connections-sorted.json`.
- **createAllClusters():** creates a k-means clustering in `/path/agency/clusters.json`.
- **createAllIndexes():** creates an index with stop-cluster pairs in `/path/agency/index.json`.
- **createAllFragments():** Fragments connections by clustering and time, these are stored in `/path/agencyname/clusterid/fragmentid`.
- **createAllClusterSummaries():** Creates a summary graph which contains all clusters and their respective neighbours in `/path/agency/summary.json`.

Or you can run them all at once via:
```bash
$ npm run fragment
```

Once all data are processed you can start the server as such:
```bash
$ npm run serve
```

## Usage
Following endpoints are made available for usage:
- **/{agency}/stops** Array with all stops.
- **/{agency}/index** Index with stop-cluster pairs.
- **/{agency}/clusters** Cluster summary graph.
- **/{agency}/{cluster}/connections{?departureTime}** Page with chronologically sorted connections starting at departureTime and hypermedia descriptors to navigate to the previous or next page.
# License

MIT
