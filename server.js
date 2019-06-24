const express = require('express')
const router = require('./router.js')
const config = require('./config.js')
const port = config.port

let app = express()
app.use('/', router)

app.listen(port, () => console.log('Listening on port ' + port))