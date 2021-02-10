import * as Sentry from '@sentry/node'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { log } from 'firebase-functions/lib/logger'
import router from './Routes'

dotenv.config()

const app = express()

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())
app.use(Sentry.Handlers.errorHandler())

app.use(cors())
app.use('/', router)

app.listen(5000, () => {
  log(`App listening at http://localhost:5000`)
})
