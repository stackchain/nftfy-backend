import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import * as functions from 'firebase-functions'
import router from './Routes'

dotenv.config()

const app = express()

Sentry.init({
  dsn: 'https://abb429f871be437e84c869c5ed1f421b@o501737.ingest.sentry.io/5591829',
  integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
  tracesSampleRate: 1.0,
  environment: 'development'
})

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())
app.use(Sentry.Handlers.errorHandler())

app.use(cors())
app.use('/', router)

exports.api = functions.https.onRequest(app)
