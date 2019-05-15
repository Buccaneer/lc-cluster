module.exports = class Clustering {
    
    /** KMEANS CLUSTERING **/

    static kMeansCluster(stops, n) {
        // Convert from Object with Key:Value pairs to Array of stops
        stops = Object.keys(stops).map(key => stops[key])
        let candidates = Array.from(stops)
        
        // Pick n random stops as clusters, then add all the closest stops to their respective clusters
        let clusters = []
        for (let i = 0; i < n; ++i) {
            let chosen = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]
            clusters.push({id: i, latitude: chosen.latitude, longitude: chosen.longitude, stops: []})
        }
        for (let s = 0; s < stops.length; ++s) {
            let clusterIndex = 0
            let clusterDistance = Infinity
            for (let c = 0; c < clusters.length; ++c) {
                let distance = this.distance(stops[s].latitude, stops[s].longitude, clusters[c].latitude, clusters[c].longitude)
                if (distance < clusterDistance) {
                    clusterDistance = distance
                    clusterIndex = c
                }
            }
            clusters[clusterIndex].stops.push(stops[s])
        }

        // Repeat kMeans until clusters no longer change
        let rounds = 0
        let newClusters = this.kMeans(clusters, stops)
        while (!this.isSameClustering(clusters, newClusters)) {
            clusters = newClusters 
            newClusters = this.kMeans(clusters, stops)
            ++rounds
        }
        console.log("#ROUNDS="+rounds)
        return clusters
    }
    
    static kMeans(clusters, stops) {
        let newClusters = clusters.map(cluster => { return { id: cluster.id, latitude: cluster.latitude, longitude: cluster.longitude, stops: Array.from(cluster.stops)} })
        for (let c = 0; c < newClusters.length; ++c) {
            let seed = this.seed(newClusters[c])
            newClusters[c].latitude = seed.latitude
            newClusters[c].longitude = seed.longitude
            newClusters[c].stops = []
        }
        // Find the closest cluster for every stop
        for (let s = 0; s < stops.length; ++s) {
            let clusterIndex = 0
            let clusterDistance = Infinity
            for (let c = 0; c < newClusters.length; ++c) {
                let distance = this.distance(stops[s].latitude, stops[s].longitude, newClusters[c].latitude, newClusters[c].longitude)
                if (distance < clusterDistance) {
                    clusterDistance = distance
                    clusterIndex = c
                }
            }
            newClusters[clusterIndex].stops.push(stops[s])
        }
        return newClusters
    }
    
    // Returns string representation of clusters (sorts the clusters first)
    static stringify(clusters) {
        let sorted = clusters.sort((a,b) => {
            let lat = a.latitude - b.latitude
            return lat !== 0 ? lat : a.longitude - b.longitude
        })
        return sorted.reduce((acc, cluster) => acc + cluster.latitude + ";" + cluster.longitude + ";", "")        
    }
    
    // Returns whether two clusters have the same reference points
    static isSameClustering(clusters1, clusters2) {
        return this.stringify(clusters1) == this.stringify(clusters2)
    }
    
    // Calculates centroid of cluster then returns stop closest to the centroid
    static seed(cluster) {
        let centroid = this.centroid(cluster)
        let mean = undefined
        let closestDistance = undefined
        for (let s = 0; s < cluster.stops.length; ++s) {    
            let distance = this.distance(centroid.latitude, centroid.longitude, cluster.stops[s].latitude, cluster.stops[s].longitude)
            if (!closestDistance || distance < closestDistance) {
                mean = cluster.stops[s]
                closestDistance = distance
            }
        }
        if (!mean) console.log("Could not find centroid of cluster with id: " + cluster.id)
        return mean
    }

    // Calculates centroid of cluster
    static centroid(cluster) {
        // NOTE: latitude [-90, 90] (South-North)
        //       longitude [-180, 180] (West-East)
        let x = 0, y = 0, z = 0 // Cartesian coordinates
        for (let i = 0; i < cluster.stops.length; ++i) {
            let lat = cluster.stops[i].latitude / 180 * Math.PI
            let lon = cluster.stops[i].longitude / 180 * Math.PI
            // Convert lat/lon to Cartesian and calculate (rolling) average
            x = x * (i)/(i+1) + Math.cos(lat) * Math.cos(lon) / (i+1)
            y = y * (i)/(i+1) + Math.cos(lat) * Math.sin(lon) / (i+1)
            z = z * (i)/(i+1) + Math.sin(lat) / (i+1)
        }
        // Convert back to lat/lon
        return {latitude: Math.atan2(z, Math.sqrt(x*x + y*y)) * 180 / Math.PI, longitude: Math.atan2(y, x) * 180 / Math.PI}
    }
    
    // Calculates distance between two (latitude, longitude) pairs in meters, as the crow flies
    static distance(lat1, lon1, lat2, lon2) {
        // Convert to radians
        lat1 = lat1 / 180 * Math.PI
        lon1 = lon1 / 180 * Math.PI
        lat2 = lat2 / 180 * Math.PI
        lon2 = lon2 / 180 * Math.PI
        let R = 6371e3 // Radius earth in meters
        let a = Math.sin((lat2-lat1)/2)
        let b = Math.sin((lon2-lon1)/2)
        let c = Math.cos(lat1) * Math.cos(lat2)
        return 2*R*Math.asin(Math.sqrt(a*a + c*b*b))
    }
    
    /** END KMEANS CLUSTERING **/
    
    
    /** MERGE BASED CLUSTERING **/
    
    // Naive and VERY inefficient implementation of merge based clustering
    static mergeBasedCluster(stops, n) {
        // Wrap each stop in an array
        let clusters = Object.keys(stops).map(key => [stops[key]])
        while (clusters.length > n) {
            let a = 0
            let b = 0
            let max = 0
            for (let i = 0; i < clusters.length; ++i) {
                for (let j = i + 1; j < clusters.length; ++j) {
                    let util = this.utilFunction(clusters[i], clusters[j])
                    if (util > max) {
                        max = util
                        a = i
                        b = j
                    }    
                }
            }
            clusters[a].push(... clusters[b]) // push stops of b onto a
            clusters.splice(b, 1) // remove b    
        }
        return clusters
    }
    
    // Calculates util value for clusters a and b
    // A cluster is [stops]
    static utilFunction(a, b) {
        let wab = a.map(s => Object.keys(s.neighbours).filter(n => b.findIndex(e => e["@id"] == n) > -1).reduce((acc, n) => acc + s.neighbours[n].count, 0)).reduce((acc, val) => acc + val, 0) 
        let wba = b.map(s => Object.keys(s.neighbours).filter(n => a.findIndex(e => e["@id"] == n) > -1).reduce((acc, n) => acc + s.neighbours[n].count, 0)).reduce((acc, val) => acc + val, 0) 
        return 1 / a.length / b.length * (wab / Math.sqrt(a.length) + wba / Math.sqrt(b.length))
    }
    
    /** END MERGE BASED CLUSTERING **/
    
}
