import express from 'express'
import cors from 'cors'
import { createPayPalPayment } from './payments/paypal.js'
import { createBinancePayment } from './payments/binance.js'
import { handlePayPalWebhook } from './webhooks/paypal.js'
import { handleBinanceWebhook } from './webhooks/binance.js'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/create-payment', async (req, res) => {
  const { userId, planId, method } = req.body

  if (method === 'paypal') {
    const link = await createPayPalPayment(userId, planId)
    return res.json({ ok: true, link })
  }

  if (method === 'binance') {
    const link = await createBinancePayment(userId, planId)
    return res.json({ ok: true, link })
  }

  res.status(400).json({ ok: false, error: 'Método de pago inválido' })
})
const admin = require("firebase-admin")

admin.messaging().send({
  token: user.fcmToken,
  notification: {
    title: "¡Pago confirmado!",
    body: "Tu plan premium ya está activo 🎉"
  }
})


app.get('/paypal/success', handlePayPalWebhook)
app.post('/webhook/binance', handleBinanceWebhook)

app.get('/', (req, res) => res.send('Backend activo en Fly.io 🚀'))

app.listen(process.env.PORT || 8080, () => {
  console.log('Servidor corriendo en Fly.io')
})

