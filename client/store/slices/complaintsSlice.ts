import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ComplaintStatus } from '@/components/StatusChip';

export interface ComplaintFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Complaint {
  id: string;
  type: string;
  description: string;
  mobile: string;
  email?: string;
  ward: string;
  area: string;
  location?: string;
  address?: string;
  status: ComplaintStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy: string;
  submittedDate: string;
  lastUpdated: string;
  assignedTo?: string;
  slaDeadline: string;
  files: ComplaintFile[];
  remarks: string[];
  isAnonymous?: boolean;
}

export interface ComplaintFormData {
  mobile: string;
  email?: string;
  problemType: string;
  ward: string;
  area: string;
  location?: string;
  address?: string;
  description: string;
  files: File[];
  captcha: string;
}

export interface ComplaintsState {
  complaints: Complaint[];
  myComplaints: Complaint[];
  selectedComplaint: Complaint | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: {
    search: string;
    ward: string;
    type: string;
    status: string;
    priority: string;
    assignedTo: string;
    dateFrom: string;
    dateTo: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: ComplaintsState = {
  complaints: [],
  myComplaints: [],
  selectedComplaint: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {
    search: '',
    ward: 'all',
    type: 'all',
    status: 'all',
    priority: 'all',
    assignedTo: '',
    dateFrom: '',
    dateTo: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// Generate mock complaint ID
const generateComplaintId = (): string => {
  const year = new Date().getFullYear();
  const number = Math.floor(Math.random() * 1000) + 1;
  return `CMP-${year}-${number.toString().padStart(3, '0')}`;
};

// Async thunks
export const submitComplaint = createAsyncThunk(
  'complaints/submit',
  async (formData: ComplaintFormData, { rejectWithValue }) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const complaint: Complaint = {
        id: generateComplaintId(),
        type: formData.problemType,
        description: formData.description,
        mobile: formData.mobile,
        email: formData.email,
        ward: formData.ward,
        area: formData.area,
        location: formData.location,
        address: formData.address,
        status: 'registered',
        priority: 'medium',
        submittedBy: formData.mobile,
        submittedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
        files: formData.files.map((file, index) => ({
          id: `file-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
        })),
        remarks: [`Complaint registered on ${new Date().toLocaleDateString()}`],
      };

      return complaint;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to submit complaint');
    }
  }
);

export const fetchComplaints = createAsyncThunk(
  'complaints/fetchAll',
  async (params: { page: number; limit: number; filters?: Partial<ComplaintsState['filters']> }, { rejectWithValue }) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockComplaints: Complaint[] = [
        {
          id: 'CMP-2024-001',
          type: 'Water Supply',
          description: 'No water supply for the past 3 days in Green Valley Society.',
          mobile: '+91 9876543210',
          email: 'john.doe@email.com',
          ward: 'Ward 1',
          area: 'Green Valley Society',
          status: 'assigned',
          priority: 'high',
          submittedBy: 'John Doe',
          submittedDate: '2024-01-15T08:30:00Z',
          lastUpdated: '2024-01-15T14:30:00Z',
          assignedTo: 'Mike Johnson',
          slaDeadline: '2024-01-17T18:00:00Z',
          files: [],
          remarks: ['Complaint registered', 'Assigned to maintenance team'],
        },
        {
          id: 'CMP-2024-002',
          type: 'Street Lighting',
          description: 'Street lights not working on Main Street.',
          mobile: '+91 9876543211',
          ward: 'Ward 3',
          area: 'Main Street',
          status: 'in-progress',
          priority: 'medium',
          submittedBy: 'Jane Smith',
          submittedDate: '2024-01-14T10:15:00Z',
          lastUpdated: '2024-01-15T10:15:00Z',
          assignedTo: 'Sarah Wilson',
          slaDeadline: '2024-01-19T18:00:00Z',
          files: [],
          remarks: ['Complaint registered', 'Work in progress'],
        },
      ];

      return {
        complaints: mockComplaints,
        total: mockComplaints.length,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch complaints');
    }
  }
);

export const fetchMyComplaints = createAsyncThunk(
  'complaints/fetchMy',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock user complaints
      const mockComplaints: Complaint[] = [
        {
          id: 'CMP-2024-003',
          type: 'Garbage Collection',
          description: 'Garbage not collected for 3 days.',
          mobile: '+91 9876543210',
          email: 'john.doe@email.com',
          ward: 'Ward 1',
          area: 'Green Valley Society',
          status: 'resolved',
          priority: 'medium',
          submittedBy: 'John Doe',
          submittedDate: '2024-01-10T09:00:00Z',
          lastUpdated: '2024-01-12T16:00:00Z',
          assignedTo: 'Cleanup Team',
          slaDeadline: '2024-01-13T18:00:00Z',
          files: [],
          remarks: ['Complaint registered', 'Cleanup scheduled', 'Resolved'],
        },
      ];

      return mockComplaints;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch complaints');
    }
  }
);

export const updateComplaintStatus = createAsyncThunk(
  'complaints/updateStatus',
  async ({ id, status, remarks }: { id: string; status: ComplaintStatus; remarks?: string }, { rejectWithValue }) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        id,
        status,
        remarks,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update status');
    }
  }
);

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    setSelectedComplaint: (state, action: PayloadAction<Complaint | null>) => {
      state.selectedComplaint = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<ComplaintsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        ward: 'all',
        type: 'all',
        status: 'all',
        priority: 'all',
        assignedTo: '',
        dateFrom: '',
        dateTo: '',
      };
    },
    setPagination: (state, action: PayloadAction<Partial<ComplaintsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    // Optimistically update complaint in the list
    updateComplaintInList: (state, action: PayloadAction<{ id: string; updates: Partial<Complaint> }>) => {
      const { id, updates } = action.payload;
      const complaintIndex = state.complaints.findIndex(c => c.id === id);
      if (complaintIndex !== -1) {
        state.complaints[complaintIndex] = { ...state.complaints[complaintIndex], ...updates };
      }
      
      const myComplaintIndex = state.myComplaints.findIndex(c => c.id === id);
      if (myComplaintIndex !== -1) {
        state.myComplaints[myComplaintIndex] = { ...state.myComplaints[myComplaintIndex], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit complaint
      .addCase(submitComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.complaints.unshift(action.payload);
        state.myComplaints.unshift(action.payload);
        state.error = null;
      })
      .addCase(submitComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Fetch all complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints = action.payload.complaints;
        state.pagination.total = action.payload.total;
        state.error = null;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my complaints
      .addCase(fetchMyComplaints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myComplaints = action.payload;
      })
      .addCase(fetchMyComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update complaint status
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        const { id, status, remarks, lastUpdated } = action.payload;
        
        // Update in complaints list
        const complaintIndex = state.complaints.findIndex(c => c.id === id);
        if (complaintIndex !== -1) {
          state.complaints[complaintIndex].status = status;
          state.complaints[complaintIndex].lastUpdated = lastUpdated;
          if (remarks) {
            state.complaints[complaintIndex].remarks.push(remarks);
          }
        }
        
        // Update in my complaints list
        const myComplaintIndex = state.myComplaints.findIndex(c => c.id === id);
        if (myComplaintIndex !== -1) {
          state.myComplaints[myComplaintIndex].status = status;
          state.myComplaints[myComplaintIndex].lastUpdated = lastUpdated;
          if (remarks) {
            state.myComplaints[myComplaintIndex].remarks.push(remarks);
          }
        }
      });
  },
});

export const {
  setSelectedComplaint,
  updateFilters,
  clearFilters,
  setPagination,
  clearError,
  updateComplaintInList,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
