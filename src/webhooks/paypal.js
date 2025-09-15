import { updateUserPlan } from '../utils/firestore.js'

export async function handlePayPalWebhook(req, res) {
  const { token } = req.query
  // Podés capturar el pago si querés validar más
  const reference = req.query.reference_id || 'paypal_premium_user123'
  const [_, planId, userId] = reference.split('_')
  await updateUserPlan(userId, planId)
  res.redirect('https://tu-app.com/pago-exitoso')
}
