import admin from 'firebase-admin'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serviceAccount = require(path.join(__dirname, '../../glove-f3835-firebase-adminsdk-fbsvc-fd4e588dd1.json'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

export async function updateUserPlan(userId, planId) {
  await db.collection('users').doc(userId).set({
    plan: planId,
    updatedAt: Date.now()
  }, { merge: true })
}
