const fs = require('fs'),
    config = require('./config.js')

module.exports = new class Clusters {
    
    getClusters(req, res) {
        fs.readFile(config.path + '/' + req.params.agency + '/clusters.json', (err, file) => {
            let clusters = JSON.parse(file)
            res.json(clusters)
        })
    }
}
