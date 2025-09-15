import { updateUserPlan } from '../utils/firestore.js'

export async function handleBinanceWebhook(req, res) {
  const { merchantTradeNo, status } = req.body
  if (status === 'PAID') {
    const [_, planId, userId] = merchantTradeNo.split('_')
    await updateUserPlan(userId, planId)
  }
  res.sendStatus(200)
}
