import crypto from 'crypto';

class KeyManager {
  constructor() {
    this.keys = new Map();
    this.currentKeyId = null;
    this.rotationInterval = 1 * 60 * 60 * 1000; // Rotate every hour instead of 24 hours
    
    // Initialize with environment key and timestamp
    this.addKey(process.env.JWT_SECRET, `env-${Date.now()}`);
    this.generateNewKey(); // Generate first rotating key
    
    // Start key rotation
    setInterval(() => this.rotateKeys(), this.rotationInterval);
  }

  generateNewKey() {
    const keyId = Date.now().toString();
    const secret = crypto.randomBytes(64).toString('hex');
    this.addKey(secret, keyId);
    console.log('New key generated:', keyId); // Add logging
    return { keyId, secret };
  }

  addKey(secret, keyId) {
    this.keys.set(keyId, secret);
    this.currentKeyId = keyId;
  }

  getCurrentKey() {
    return {
      keyId: this.currentKeyId,
      secret: this.keys.get(this.currentKeyId)
    };
  }

  getKey(keyId) {
    return this.keys.get(keyId);
  }

  rotateKeys() {
    // Remove old keys (keep last 2 for validation)
    const keyIds = Array.from(this.keys.keys());
    if (keyIds.length > 2) {
      this.keys.delete(keyIds[0]);
    }
    this.generateNewKey();
  }
}

export default new KeyManager();
