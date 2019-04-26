const Fetcher = require('./fetcher.js'),
    ConnectionStream = require('./connection-stream.js')

module.exports = class Clustering {
    
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
