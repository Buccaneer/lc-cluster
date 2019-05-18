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
            // TODO find a better place for this template
            let hydraTemplate = {
                "@context": {
                    "schema": "http://schema.org/",
                    "name": "http://xmlns.com/foaf/0.1/name",
                    "longitude": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
                    "latitude": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
                    "alternative": "http://purl.org/dc/terms/alternative",
                    "avgStopTimes": "http://semweb.mmlab.be/ns/stoptimes#avgStopTimes",
                    "country": {
                        "@type": "@id",
                        "@id": "http://www.geonames.org/ontology#parentCountry"
                    },
                    "operationZone": {
                        "@type": "@id",
                        "@id": "schema:areaServed"
                    }
                },
                "@graph": []
            }
            hydraTemplate["@graph"] = stops
            res.json(hydraTemplate)
        })
    }
    
    getIndex(req, res) {
        fs.readFile(config.path + '/' + req.params.agency + '/index.json', (err, file) => {
            let index = JSON.parse(file)
            res.json(index)
        })
    }
}
