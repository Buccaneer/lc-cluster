const fs = require('fs'),
    fsp = require('fs').promises
    config = require('./config.js')

module.exports = new class PageFinder {

    constructor() {
        this.pages = {}
        // Note: does not check if file/dir
        for (let agency of config.agencies) {
            this.pages[agency.name] = []
            // NOTE: <= because extra "cluster" which contains all fragments
            for (let cluster = 0; cluster <= agency.clusters; ++cluster) {
                this.pages[agency.name][cluster] = []
                let path = config.path + '/' + agency.name + '/' + cluster
                if (fs.existsSync(path)) {
                    fs.readdirSync(path).forEach(page => {
                        this.pages[agency.name][cluster].push(page)
                    })
                    this.pages[agency.name][cluster].sort()
                } 
            }
        }
        //console.log(this.pages)
    }
    
    getConnections(req, res) {
        let agency = req.params.agency
        let cluster = req.params.cluster
        let target = req.query.departureTime ? this.toFileName(req.query.departureTime) : this.toFileName(config.startTime)
        try {
            let [fragment, index] = this.findResource(target, agency, cluster)
            fsp.readFile(config.path + '/' + agency + '/' + cluster + '/' + fragment)
                .then((file) => {
                    console.log(agency + '/' + cluster + '/' + fragment)
                    let page = JSON.parse(file)
                    let params = {
                        data: page,
                        agency: req.params.agency,
                        cluster: req.params.cluster,
                        index: index,
                        departureTime: this.toISODate(fragment)
                    }
                    this.addHydraMetadata(params).then((jsonld) => res.json(jsonld))
                }) 
        } catch (error) {
            res.redirect(req.originalUrl + '?departureTime=' + this.pages[agency][cluster][0])
        }
    }
    
    toFileName(isostring) {
        return isostring.replace(new RegExp(':', 'g'),'D') + '.jsonld'
    }
    
    toISODate(filename) {
        return filename.replace('.jsonld', '').replace(new RegExp('D', 'g'),':')
    }
    
    findNext(agency, cluster, index) {
        if (Number(index) + 1 >= this.pages[agency][cluster].length) return undefined
        return this.pages[agency][cluster][Number(index) + 1].replace('.jsonld', '')
    }
    
    findPrevious(agency, cluster, index) {
        if (Number(index) - 1 < 0) return undefined
        return this.pages[agency][cluster][Number(index) - 1].replace('.jsonld', '')
    }
    
    async addHydraMetadata(params) {
        return fsp.readFile('./skeleton.jsonld')
            .then((file) => {
                let jsonld_skeleton = JSON.parse(file)
                let data = params.data
                let host = 'http://' + config.host + '/';
                let agency = params.agency;
                let cluster = params.cluster;
                let index = params.index
                let departureTime = params.departureTime;

                jsonld_skeleton['@id'] = host + agency + '/' + cluster + '/connections?departureTime=' + new Date(departureTime).toISOString();

                let next = this.findNext(agency, cluster, index)
                if (next) {
                    jsonld_skeleton['hydra:next'] = host + agency + '/' + cluster + '/connections?departureTime=' + new Date(this.toISODate(next)).toISOString();
                }

                let prev = this.findPrevious(agency, cluster, index)
                if (prev && prev !== null) {
                    jsonld_skeleton['hydra:previous'] = host + agency + '/' + cluster + '/connections?departureTime=' + new Date(this.toISODate(prev)).toISOString();
                }

                jsonld_skeleton['hydra:search']['hydra:template'] = host + agency + '/' + cluster + '/connections{?departureTime}';
                jsonld_skeleton['@graph'] = data;

                return jsonld_skeleton
            })
    }
    
    findResource(target, agency, cluster) {
        let fragment = null;
        let fragments = this.pages[agency][cluster];

        // Checking that target date is contained in the list of fragments.
        if (fragments && target >= fragments[0] && target <= fragments[fragments.length - 1]) {
            fragment = this.binarySearch(target, fragments);
        } else if (target < fragments[0]) {
            fragment = [fragments[0], 0]
        } else if (target > fragments[fragments.length - 1]) {
            fragment = [fragments[fragments.length - 1], fragments.length - 1]
        }
        if (fragment !== null) {
            return fragment;
        } else {
            throw new Error('Fragment not found in current data');
        }
    }

    // Binary search algorithm to find the closest element from the left to a given target, in a sorted numeric array.
    // If the target is not contained in the array it returns null. 
    binarySearch(target, array) {
        let min = 0;
        let max = array.length - 1;
        let index = null;

        // Checking that target is contained in the array.
        if (target >= array[min] && target <= array[max]) {
            // Perform binary search to find the closest, rounded down element to the target in the array .
            while (index === null) {
                // Divide the array in half
                let mid = Math.floor((min + max) / 2);
                // Target date is in the right half
                if (target > array[mid]) {
                    if (target < array[mid + 1]) {
                        index = mid;
                    } else if (target === array[mid + 1]) {
                        index = mid + 1;
                    } else {
                        // Not found yet proceed to divide further this half in 2.
                        min = mid;
                    }
                    // Target date is exactly equal to the middle element
                } else if (target === array[mid]) {
                    index = mid;
                    // Target date is on the left half
                } else {
                    if (target >= array[mid - 1]) {
                        index = mid - 1;
                    } else {
                        max = mid;
                    }
                }
            }
        } else {
            return null;
        }
        return [array[index], index];
    }
    
}

