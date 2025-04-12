import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['access', 'refresh'],
    required: true,
    default: 'access' // Add default value
  },
  expires: {
    type: Date,
    required: true
  },
  blacklisted: {
    type: Boolean,
    default: false
  },
  family: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Add TTL index to automatically remove expired tokens
TokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
TokenSchema.index({ user: 1, type: 1 });
TokenSchema.index({ token: 1 });

export default mongoose.model('Token', TokenSchema);
