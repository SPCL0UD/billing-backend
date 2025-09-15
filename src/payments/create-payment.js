import express from 'express'
import { createPayPalLink } from './paypal.js'
import { createBinanceLink } from './binance.js'

const router = express.Router()

router.post('/create-payment', async (req, res) => {
  const { userId, planId, method } = req.body

  if (!userId || !planId || !method) {
    return res.status(400).json({ ok: false, error: 'Missing parameters' })
  }

  try {
    let link

    if (method === 'paypal') {
      link = await createPayPalLink(userId, planId)
    } else if (method === 'binance') {
      link = await createBinanceLink(userId, planId)
    } else {
      return res.status(400).json({ ok: false, error: 'Invalid method' })
    }

    res.json({ ok: true, link })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'Failed to create payment link' })
  }
})

export default router
