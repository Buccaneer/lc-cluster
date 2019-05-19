const router = require('express').Router()

const stops = require('./stops.js')
const clusters = require('./clusters.js')
const pageFinder = require('./page-finder.js')

router.get('/:agency/stops', (req, res) => {
    stops.getStops(req, res)
})

router.get('/:agency/index', (req, res) => {
    stops.getIndex(req, res)
})

router.get('/:agency/clusters', (req, res) => {
    clusters.getClusters(req, res)
})

router.get('/:agency/:cluster/connections', (req, res) => {
    console.log(req.params.agency + '/' + req.params.cluster + '@' + req.query.departureTime)
    pageFinder.getConnections(req, res)
})

module.exports = router