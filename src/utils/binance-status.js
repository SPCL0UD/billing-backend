import crypto from 'crypto'
import axios from 'axios'
import { firestore } from './firestore.js'

const BINANCE_API_KEY = process.env.BINANCE_API_KEY
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET

export async function consultarEstadoOrden(merchantTradeNo) {
  const timestamp = Date.now()
  const payload = { merchantTradeNo }
  const payloadString = JSON.stringify(payload)

  const signature = crypto
    .createHmac('sha512', BINANCE_API_SECRET)
    .update(payloadString)
    .digest('hex')

  const headers = {
    'Content-Type': 'application/json',
    'BinancePay-Timestamp': timestamp.toString(),
    'BinancePay-Signature': signature,
    'BinancePay-Certificate-SN': BINANCE_API_KEY
  }

  const response = await axios.post(
    'https://bpay.binanceapi.com/binancepay/openapi/v2/order/query',
    payload,
    { headers }
  )

  if (response.data.status === 'SUCCESS') {
    return response.data.data // contiene status, amount, etc.
  } else {
    throw new Error('Error al consultar orden: ' + response.data.code)
  }
}

