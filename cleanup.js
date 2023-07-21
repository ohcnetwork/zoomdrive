const fs = require('fs')
const path = require('path')

fs.rmSync(path.join(__dirname, 'downloads'), {recursive: true, force: true})
