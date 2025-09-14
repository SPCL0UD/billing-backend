import express from 'express'
import { createPayPalPayment } from './payments/paypal.js'
import { createBinancePayment } from './payments/binance.js'
import { handlePayPalWebhook } from './webhooks/paypal.js'
import { handleBinanceWebhook } from './webhooks/binance.js'

const app = express()
app.use(express.json())

app.post('/create-payment', async (req, res) => {
  const { userId, planId, method } = req.body
  let link
  if (method === 'paypal') link = await createPayPalPayment(userId, planId)
  if (method === 'binance') link = await createBinancePayment(userId, planId)
  res.json({ link })
})

app.get('/paypal/success', handlePayPalWebhook)
app.post('/webhook/binance', handleBinanceWebhook)

app.listen(8080, () => console.log('Servidor corriendo'))




