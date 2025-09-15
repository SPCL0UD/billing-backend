import express from 'express'
import { firestore } from './firestore.js'

const router = express.Router()

router.post('/webhook/payment-success', async (req, res) => {
  const { userId, planId, method, amount, date, purchaseToken } = req.body

  if (!userId || !planId || !method || !amount || !date) {
    return res.status(400).json({ ok: false, error: 'Missing parameters' })
  }

  try {
    // Actualizar plan del usuario
    await firestore.collection('users').doc(userId).set({
      plan: planId,
      expiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
      lastPurchaseToken: purchaseToken || null
    }, { merge: true })

    // Guardar registro del pago
    await firestore.collection('users').doc(userId).collection('payments').add({
      method,
      amount,
      date,
      status: 'Completado'
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'Failed to save payment' })
  }
})

export default router
