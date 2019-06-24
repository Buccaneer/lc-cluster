const Fragmenter = require('./fragmenter.js')

Fragmenter.createAllStops()
	.then(() => Fragmenter.createAllSortedConnections())
	.then(() => Fragmenter.createAllClusters())
	.then(() => Fragmenter.createAllIndexes())
	.then(() => {
		Fragmenter.createAllFragments()
		Fragmenter.createAllClusterSummaries()
	})
	
/*Fragmenter.createAllClusters()
	.then(() => Fragmenter.createAllIndexes())
	.then(() => {
		Fragmenter.createAllFragments()
		Fragmenter.createAllClusterSummaries()
	})*/