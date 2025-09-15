import fetch from 'node-fetch'

export async function createPayPalPayment(userId, planId) {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')

  const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const { access_token } = await tokenRes.json()

  const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '9.99'
        },
        reference_id: `paypal_${planId}_${userId}`
      }],
      application_context: {
        return_url: 'https://billing-backend.fly.dev/paypal/success',
        cancel_url: 'https://billing-backend.fly.dev/paypal/cancel'
      }
    })
  })
  const data = await orderRes.json()
  return data.links.find(l => l.rel === 'approve').href
}
