import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const remarkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['status_update', 'assignment', 'general', 'closure', 'reopen'],
    default: 'general'
  }
});

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    required: [true, 'Complaint type is required'],
    enum: [
      'Water Supply',
      'Electricity', 
      'Road Repair',
      'Garbage Collection',
      'Street Lighting',
      'Sewerage',
      'Public Health',
      'Traffic',
      'Others'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^\+?[\d\s-()]{10,}$/, 'Please enter a valid mobile number']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  location: {
    ward: {
      type: String,
      required: [true, 'Ward is required']
    },
    area: {
      type: String,
      required: [true, 'Area is required']
    },
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    landmark: String
  },
  status: {
    type: String,
    enum: ['registered', 'assigned', 'in-progress', 'resolved', 'closed', 'reopened'],
    default: 'registered'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  slaDeadline: {
    type: Date,
    required: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  files: [fileSchema],
  remarks: [remarkSchema],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  tags: [String],
  category: {
    type: String,
    default: 'general'
  },
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  estimatedResolutionTime: {
    type: Number, // in hours
    default: 72
  }
}, {
  timestamps: true
});

// Index for performance
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ submittedBy: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ 'location.ward': 1 });
complaintSchema.index({ type: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ slaDeadline: 1 });
complaintSchema.index({ createdAt: -1 });

// Compound indexes
complaintSchema.index({ status: 1, assignedTo: 1 });
complaintSchema.index({ 'location.ward': 1, status: 1 });

// Generate complaint ID before saving
complaintSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments() + 1;
    this.complaintId = `CMP-${year}-${count.toString().padStart(3, '0')}`;
  }
  next();
});

// Calculate SLA deadline based on priority
complaintSchema.pre('save', function(next) {
  if (this.isNew && !this.slaDeadline) {
    const now = new Date();
    let hoursToAdd;
    
    switch (this.priority) {
      case 'critical':
        hoursToAdd = 24; // 1 day
        break;
      case 'high':
        hoursToAdd = 48; // 2 days
        break;
      case 'medium':
        hoursToAdd = 72; // 3 days
        break;
      case 'low':
        hoursToAdd = 120; // 5 days
        break;
      default:
        hoursToAdd = 72;
    }
    
    this.slaDeadline = new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
  }
  next();
});

// Virtual for SLA status
complaintSchema.virtual('slaStatus').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') {
    return 'completed';
  }
  
  const now = new Date();
  const deadline = new Date(this.slaDeadline);
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  
  if (hoursLeft < 0) {
    return 'overdue';
  } else if (hoursLeft < 24) {
    return 'warning';
  } else {
    return 'ontime';
  }
});

// Virtual for time elapsed
complaintSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInMs = now - created;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} hours`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days`;
  }
});

// Ensure virtual fields are serialized
complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

export default mongoose.model('Complaint', complaintSchema);
