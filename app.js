const express = require('express')
const app = express()

const router = require('./router')

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// It serves static files and is based on serve-static.
app.use(express.static('public'))
// A directory or an array of directories for the application's views.
app.set('views', 'views')
// Set template engine
app.set('view engine', 'ejs')

app.use('/', router)

app.listen(3000)
