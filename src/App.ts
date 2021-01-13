import express from 'express'
import * as functions from 'firebase-functions'
import router from './routes'

const app = express()
app.use('/', router)

exports.api = functions.https.onRequest(app)
