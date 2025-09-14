import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { google } from 'googleapis'
import admin from 'firebase-admin'
import { z } from 'zod'

// Decodificar credenciales desde variables de entorno Base64
const firebaseConfig = JSON.parse(
  Buffer.from(process.env.FIREBASE_SA_BASE64, 'base64').toString('utf8')
)
const playConfig = JSON.parse(
  Buffer.from(process.env.PLAY_SA_BASE64, 'base64').toString('utf8')
)

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
})
const db = admin.firestore()

// Inicializar Google Play API
const auth = new google.auth.GoogleAuth({
  credentials: playConfig,
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
})
const androidPublisher = google.androidpublisher({ version: 'v3', auth })

// Express app
const app = express()
app.use(cors())
app.use(express.json())

// Validación de request
const VerifySchema = z.object({
  idToken: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  purchaseToken: z.string().min(1),
  type: z.enum(['subs', 'inapp']).default('subs')
})

// Verificar ID Token de Firebase
async function verifyFirebaseIdToken(idToken, expectedUid) {
  const decoded = await admin.auth().verifyIdToken(idToken)
  if (decoded.uid !== expectedUid) {
    throw new Error('UID mismatch')
  }
  return decoded
}

// Endpoint de verificación
app.post('/verify', async (req, res) => {
  try {
    const { idToken, userId, productId, purchaseToken, type } = VerifySchema.parse(req.body)
    await verifyFirebaseIdToken(idToken, userId)

    let validationResult
    const pkg = process.env.PACKAGE_NAME

    if (type === 'subs') {
      const { data } = await androidPublisher.purchases.subscriptions.get({
        packageName: pkg,
        subscriptionId: productId,
        token: purchaseToken
      })
      validationResult = data
    } else {
      const { data } = await androidPublisher.purchases.products.get({
        packageName: pkg,
        productId,
        token: purchaseToken
      })
      validationResult = data
    }

    if (!validationResult) {
      return res.status(400).json({ ok: false, error: 'No validation data' })
    }

    let plan = 'free'
    let expiry = 0

    if (type === 'subs') {
      const expiryMs = Number(validationResult.expiryTimeMillis ?? 0)
      const cancelReason = Number(validationResult.cancelReason ?? -1)
      const now = Date.now()
      const active = expiryMs > now && cancelReason !== 0
      if (active) {
        plan = productId === 'svip' ? 'svip' : 'premium'
        expiry = expiryMs
      }
    } else {
      plan = 'premium'
      expiry = Date.now() + 30 * 24 * 60 * 60 * 1000
    }

    await db.collection('users').doc(userId).set(
      {
        plan,
        expiry,
        lastPurchaseToken: purchaseToken,
        productId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    )

    return res.json({ ok: true, plan, expiry, raw: validationResult })
  } catch (err) {
    console.error(err)
    return res.status(400).json({ ok: false, error: err.message || 'Validation failed' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})

