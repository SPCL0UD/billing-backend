import crypto from 'crypto'
import axios from 'axios'

export async function createBinancePayment(userId, planId) {
  const timestamp = Date.now()
  const tradeNo = `binance_${planId}_${userId}_${timestamp}`

  const payload = {
    merchantId: process.env.BINANCE_MERCHANT_ID,
    merchantTradeNo: tradeNo,
    orderAmount: 9.99,
    currency: 'USDT',
    goods: {
      goodsType: '01',
      goodsCategory: 'D000',
      referenceGoodsId: planId,
      goodsName: 'Suscripción Premium',
      goodsDetail: 'Acceso completo por 30 días'
    }
  }

  const payloadStr = JSON.stringify(payload)
  const signature = crypto.createHmac('sha512', process.env.BINANCE_API_SECRET)
    .update(payloadStr)
    .digest('hex')

  const res = await axios.post('https://bpay.binanceapi.com/binancepay/openapi/v2/order', payload, {
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Signature': signature,
      'BinancePay-Certificate-SN': process.env.BINANCE_API_KEY
    }
  })

  return res.data.data.prepayUrl
}
app.get('/verificar-pago/:ordenId', async (req, res) => {
  const estado = await consultarEstadoOrden(req.params.ordenId)

  if (estado === 'PAID') {
    // Actualizás Firestore
    await firestore.collection('users').doc(userId).set({
      plan: 'premium',
      expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
    }, { merge: true })

    return res.json({ ok: true, estado: 'Pagado' })
  }

  res.json({ ok: true, estado })
})
