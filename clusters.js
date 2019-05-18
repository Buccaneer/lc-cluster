const fs = require('fs'),
    config = require('./config.js')

module.exports = new class Clusters {
    
    getClusters(req, res) {
        fs.readFile(config.path + '/' + req.params.agency + '/summary.json', (err, file) => {
            let clusters = JSON.parse(file)
            res.json(clusters)
        })
    }
}
