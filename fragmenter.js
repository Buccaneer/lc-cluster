let Stream = require('stream'),
    JSONStream = require('JSONStream'),
    Fetcher = require('./fetcher.js'),
    ConnectionStream = require('./connection-stream.js'),
    Clustering = require('./clustering.js'),
    fs = require('fs'),
    fsp = require('fs').promises
    PageWriterStream = require('./pagewriter-stream.js'),
    config = require('./config.js')

module.exports = class Fragmenter {

    static async createAllSummaries() {
        return Promise.all(config.agencies.map((agency) => {
            return Fragmenter.createSummary(agency.stopUrls, agency.connectionUrls, config.startTime, config.stopTime)
                .then((summary) => {
                    if (!fs.existsSync(config.path + '/' + agency.name)) {
                        fs.mkdirSync(config.path + '/' + agency.name);
                    }
                    return fsp.writeFile(config.path + '/' + agency.name + '/summary.json', JSON.stringify(summary), 'utf8')
                })
        }))
    }
    
    // Scans through connections and adds neighbours to every stop (+ count)
    static async createSummary(stopUrls, connectionUrls, startTime, stopTime) {
        return new Promise(async (resolve, reject) => {
            let summary = await Fetcher.fetchGraph(stopUrls)
            summary = summary.reduce((sum, stop) => {
                stop.neighbours = {}
                sum[stop["@id"]] = stop
                return sum
            }, {})
            let stream = ConnectionStream.create(connectionUrls, startTime, stopTime)
            stream.on('data', (connection) => {
                if (!summary[connection.departureStop]) {
                    //ignore those stops for now, possibly outdated dataset
                    //console.log("Warning: could not find stop \"" + connection.departureStop +"\" in summary.")
                    return
                }
                if (!summary[connection.departureStop].neighbours[connection.arrivalStop]) {
                    summary[connection.departureStop].neighbours[connection.arrivalStop] = {count: 1}
                } else {
                    summary[connection.departureStop].neighbours[connection.arrivalStop].count += 1
                }
            });
            stream.on('end', () => {
                resolve(summary)
            })
            stream.on('error', (error) => {
                reject(error)
            })
        })
    }

    static async createAllClusters() {
        return Promise.all(config.agencies.map((agency) => {
            return fsp.readFile(config.path + '/' + agency.name + '/summary.json', 'utf8')
            .then((file) => JSON.parse(file))
            .then((summary) => Clustering.kMeansCluster(summary, agency.clusters))
            .then((clusters) => fsp.writeFile(config.path + '/' + agency.name + '/clusters.json', JSON.stringify(clusters), 'utf8'))
        }))
    }
    
    static async createAllIndexes() {
        return Promise.all(config.agencies.map((agency) => {
            return fsp.readFile(config.path + '/' + agency.name + '/clusters.json', 'utf8')
            .then((file) => JSON.parse(file))
            .then((clusters) => {
                let index = {}
                for (let c = 0; c < clusters.length; ++c) {
                    let stops = clusters[c].stops
                    for (let s = 0; s < stops.length; ++s) {
                        index[stops[s]["@id"]] = clusters[c].id
                    }
                }
                return index
            })
            .then((index) => fsp.writeFile(config.path + '/' + agency.name + '/index.json', JSON.stringify(index), 'utf8'))
        }))
    }
    
    static async createAllSortedConnections() {
        return Promise.all(config.agencies.map((agency) => Fragmenter.createSortedConnections(agency.connectionUrls, config.path + '/' + agency.name)))
    }

    static async createSortedConnections(urls, agencyPath) {
        return new Promise((resolve, reject) => {
            let connections = []
            let stream = ConnectionStream.create(urls, config.startTime, config.endTime)
            stream.on('data', (connection) => {
                if (connection.departureTime >= config.startTime && connection.departureTime < config.endTime) connections.push(connection)
            });
            stream.on('end', () => {
                connections.sort((connectionA, connectionB) => connectionB.departureTime - connectionA.departureTime)
                let stringifyStream = JSONStream.stringify()
                let writeStream = fs.createWriteStream(agencyPath + '/connections-sorted.json', 'utf8')
                stringifyStream.pipe(writeStream)
                connections.forEach(stringifyStream.write)
                stringifyStream.end()
                resolve()
                //resolve(fsp.writeFile(agencyPath + '/connections-sorted.json', JSON.stringify(connections), 'utf8'))
            }) 
        })
    }
    
    static createAllFragments() {
        config.agencies.forEach((agency) => Fragmenter.createFragments(config.path + '/' + agency.name))
    }
    
    static createFragments(agencyPath) {
        let connections = JSON.parse(fs.readFileSync(agencyPath + '/connections-sorted.json', 'utf8'));
        let index = JSON.parse(fs.readFileSync(agencyPath + '/index.json', 'utf8'));
        let clusters = []
        for (let connection of connections) {
            let clusterIndex = index[connection.departureStop]
            if (Array.isArray(clusters[clusterIndex])) {
                clusters[clusterIndex].push(connection)
            } else {
                clusters[clusterIndex] = [connection]
            }
        }
        for (let i = 0; i < clusters.length; ++i) {
            if (clusters[i]) {
                console.log('Cluster ' + i + ': ' + clusters[i].length)
                if (!fs.existsSync(agencyPath + '/' + i)) {
                    fs.mkdirSync(agencyPath + '/' + i);
                }
                const connectionStream = new Stream.Readable({objectMode: true})
                connectionStream.pipe(new PageWriterStream(agencyPath + '/' + i, 50000))
                clusters[i].forEach((connection) => connectionStream.push(connection))
                connectionStream.push(null)
            }
        }
    }
}
