/**
 * Optional Firebase Admin SDK. When FIREBASE_SERVICE_ACCOUNT_JSON is unset,
 * getAdmin() returns null and /api/auth/firebase-session is disabled.
 */
let _admin = undefined;

function getAdmin() {
  if (_admin !== undefined) return _admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || !String(raw).trim()) {
    _admin = null;
    return null;
  }

  try {
    const admin = require('firebase-admin');
    const cred = JSON.parse(String(raw).trim());
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(cred),
      });
    }
    _admin = admin;
    return admin;
  } catch (e) {
    console.error('[firebase-admin] init failed:', e.message);
    _admin = null;
    return null;
  }
}

function isFirebaseAdminConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).trim());
}

module.exports = { getAdmin, isFirebaseAdminConfigured };
