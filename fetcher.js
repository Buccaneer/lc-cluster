const http = require('follow-redirects/http'),
    https = require('follow-redirects/https'),
    async = require('async');

module.exports = class Fetcher {

    /** Takes a (array of) url and fetches (and merges) its @graph component(s) */
    static async fetchGraph(urls) {
        if (Array.isArray(urls)) {
            return new Promise((resolve, reject) => {
                async.transform(
                    urls, [], 
                    async (allStops, url) => allStops.push(... await this.fetchGraph(url)), 
                    (err, allStops) => err ? reject(err) : resolve(allStops)
                )
            })
        } else {
            let json = await this.fetchJSON(urls)
            return json["@graph"]
        }
    }

    /** Takes a url and fetches (and merges) its @graph component(s) */
    static async fetchJSON(url) {
        return new Promise((resolve, reject) => {
            const fetcher = url.startsWith('https') ? https : http
            const req = fetcher.get(url, response => {
                let body = ''
                response.on('data', chunk => body += chunk)
                response.on('end', () => resolve(JSON.parse(body)))
            })
            req.on('error', error => reject(error))
        })
    }
}
