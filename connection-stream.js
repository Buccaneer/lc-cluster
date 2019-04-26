const { Readable } = require('stream'),
    fetcher = require('./fetcher.js'),
    mergeStream = require('merge-stream'),
    URI = require('uri-js')

module.exports = class ConnectionStream extends Readable {
    
    constructor (url, stopTime) {
        super({objectMode: true})
        this.url = url
        this.stopTime = stopTime instanceof Date ? stopTime : new Date(stopTime)
        this.connections = []
    }
    
    // TODO: implement stop condition
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
    
    static create(urls, stopTime) {
        let streams = urls.map((url) => new ConnectionStream(url, stopTime))
        return mergeStream(...streams)
    }
}
