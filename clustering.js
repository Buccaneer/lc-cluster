const Fetcher = require('./fetcher.js'),
    ConnectionStream = require('./connection-stream.js')

module.exports = class Clustering {
    
    static cluster(stops) {
        // Turn stops object into array
        clusters = Object.keys(stops).map(key => [stops[key]])
        // TODO
        this.constructor.utilFunction()
    }
    
    // Calculates util value for clusters a and b
    // A cluster is [stops]
    static utilFunction(a, b) {
        let wab = a.map(s => Object.keys(s.neighbours).filter(n => b.findIndex(e => e["@id"] == n) > -1).reduce((acc, n) => acc + s.neighbours[n].count, 0)).reduce((acc, val) => acc + val, 0) 
        let wba = b.map(s => Object.keys(s.neighbours).filter(n => a.findIndex(e => e["@id"] == n) > -1).reduce((acc, n) => acc + s.neighbours[n].count, 0)).reduce((acc, val) => acc + val, 0) 
        return 1 / a.length / b.length * (wab / Math.sqrt(a.length) + wba / Math.sqrt(b.length))
    }
    
    static createSummary(stopUrls, connectionUrls, startTime, stopTime) {
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
}
