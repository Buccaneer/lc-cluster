const express = require('express')
const router = require('./router.js')
const port = 3000

let app = express()
app.use('/', router)

app.listen(port, () => console.log('Listening on port ' + port))