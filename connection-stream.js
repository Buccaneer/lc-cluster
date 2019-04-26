const { Readable } = require('stream'),
    fetcher = require('./fetcher.js'),
    mergeStream = require('merge-stream'),
    URI = require('uri-js')

module.exports = class ConnectionStream extends Readable {
    
    constructor (url, startTime, stopTime) {
        super({objectMode: true})
        this.startTime = startTime instanceof Date ? startTime : new Date(startTime)
        this.stopTime = stopTime instanceof Date ? stopTime : new Date(stopTime)
        this.url = this.formQuery(url, this.startTime)
        this.connections = []
    }
    
    formQuery(url, time) {
        let parsed = URI.parse(url)
        parsed.query = "departureTime=" + time.toISOString()
        return URI.serialize(parsed)
    }
    
    // TODO: implement pre-fetching _before_ you run out of connections
    _read() {
        if (this.connections.length > 0) {
            this.push(this.connections.shift())
        } else {
            let time = new Date(URI.parse(this.url).query.split(/&/)
                .filter(t => t.startsWith('departureTime'))[0]
                .split("=")[1])
            if (time < this.stopTime) {
                fetcher.fetchJSON(this.url).then((json) => {
                    this.url = json['hydra:next']
                    this.connections = json['@graph']
                    this.push(this.connections.shift())
                })
            } else {
                this.push(null)
            }
        }
    }
    
    static create(urls, startTime, stopTime) {
        let streams = urls.map((url) => new ConnectionStream(url, startTime, stopTime))
        return mergeStream(...streams)
    }
}
