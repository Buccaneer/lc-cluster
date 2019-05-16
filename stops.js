const Fetcher = require('./fetcher.js'),
    fs = require('fs'),
    config = require('./config.js')

module.exports = new class Stops {

    fetchStops() {
        for (let agency of config.agencies) {
            let stops = fetchGraph(agency.stopUrls)
                if (!fs.existsSync(config.path + '/' + agency.name)) {
                fs.mkdirSync(this.path + '/' + agency.name);
            }
            fs.writeFileSync(config.path + '/' + agency.name + '/stops.json', JSON.stringify(stops), 'utf8')
        }    
    }
    
    getStops(req, res) {
        fs.readFile(config.path + '/' + req.params.agency + '/stops.json', (err, file) => {
            let stops = JSON.parse(file)
            res.json(stops)
        })
    }
}
