const { Readable } = require('stream'),
    fetcher = require('./fetcher.js'),
    mergeStream = require('merge-stream')

module.exports = class ConnectionStream extends Readable {
    
    constructor (url, stopTime) {
        super({objectMode: true})
        this.url = url
        this.stopTime = stopTime
        this.connections = []
    }
    
    // TODO: implement stop condition
    // TODO: implement pre-fetching _before_ you run out of connections
    _read() {
        if (this.connections.length > 0) {
            this.push(this.connections.shift())
        } else {
            fetcher.fetchJSON(this.url).then((json) => {
                this.url = json['hydra:next']
                this.connections = json['@graph']
                this.push(this.connections.shift())
            })
        }
    }
    
    static create(urls, stopTime) {
        let streams = urls.map((url) => new ConnectionStream(url, stopTime))
        return mergeStream(...streams)
    }
}
