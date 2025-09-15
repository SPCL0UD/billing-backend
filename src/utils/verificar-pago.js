import express from 'express'
import { consultarEstadoOrden } from './binance-status.js'
import { firestore } from './firestore.js'
import { consultarEstadoOrden } from './paypal-status.js'
const router = express.Router()

router.get('/verificar-pago/:ordenId/:userId/:planId', async (req, res) => {
  const { ordenId, userId, planId } = req.params

  try {
    const data = await consultarEstadoOrden(ordenId)

    if (data.status === 'PAID') {
      await firestore.collection('users').doc(userId).set({
        plan: planId,
        expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
      }, { merge: true })

      await firestore.collection('users').doc(userId).collection('payments').add({
        method: 'binance',
        amount: data.orderAmount,
        date: data.createTime,
        status: 'Completado'
      })

      return res.json({ ok: true, estado: 'Pagado' })
    }

    res.json({ ok: true, estado: data.status })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})
router.get('/verificar-paypal/:orderId/:userId/:planId', async (req, res) => {
  const { orderId, userId, planId } = req.params

  try {
    const estado = await consultarEstadoOrden(orderId)

    if (estado === 'COMPLETED') {
      await firestore.collection('users').doc(userId).set({
        plan: planId,
        expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
      }, { merge: true })

      await firestore.collection('users').doc(userId).collection('payments').add({
        method: 'paypal',
        amount: planId === 'svip' ? '6.99' : '2.99',
        date: new Date().toISOString(),
        status: 'Completado'
      })

      return res.json({ ok: true, estado: 'Pagado' })
    }

    res.json({ ok: true, estado })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})
export default router
