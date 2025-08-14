import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setComplaintsList,
  setComplaintDetails,
  updateComplaintInList,
  setServiceRequestsList,
  setServiceRequestDetails,
  setWards,
  setComplaintTypes,
  setComplaintStats,
  setActiveComplaints,
  setRecentUpdates,
  clearStaleData,
  selectComplaintsList,
  selectComplaintDetails,
  selectWards,
  selectComplaintTypes,
  selectComplaintStats,
  selectActiveComplaints,
  selectRecentUpdates,
  selectIsDataFresh,
} from '../store/slices/dataSlice';

export const useDataManager = () => {
  const dispatch = useAppDispatch();

  // Data management functions
  const cacheComplaintsList = useCallback((data: any[]) => {
    dispatch(setComplaintsList(data));
  }, [dispatch]);

  const cacheComplaintDetails = useCallback((id: string, data: any) => {
    dispatch(setComplaintDetails({ id, data }));
  }, [dispatch]);

  const updateComplaint = useCallback((id: string, updates: Partial<any>) => {
    dispatch(updateComplaintInList({ id, updates }));
  }, [dispatch]);

  const cacheWards = useCallback((data: any[]) => {
    dispatch(setWards(data));
  }, [dispatch]);

  const cacheComplaintTypes = useCallback((data: any[]) => {
    dispatch(setComplaintTypes(data));
  }, [dispatch]);

  const cacheComplaintStats = useCallback((data: any) => {
    dispatch(setComplaintStats(data));
  }, [dispatch]);

  const cacheActiveComplaints = useCallback((data: any[]) => {
    dispatch(setActiveComplaints(data));
  }, [dispatch]);

  const cacheRecentUpdates = useCallback((data: any[]) => {
    dispatch(setRecentUpdates(data));
  }, [dispatch]);

  const clearStale = useCallback(() => {
    dispatch(clearStaleData());
  }, [dispatch]);

  // Data retrieval functions
  const getComplaintsList = useCallback(() => {
    return useAppSelector(selectComplaintsList);
  }, []);

  const getComplaintDetails = useCallback((id: string) => {
    return useAppSelector(selectComplaintDetails(id));
  }, []);

  const getWards = useCallback(() => {
    return useAppSelector(selectWards);
  }, []);

  const getComplaintTypes = useCallback(() => {
    return useAppSelector(selectComplaintTypes);
  }, []);

  const getComplaintStats = useCallback(() => {
    return useAppSelector(selectComplaintStats);
  }, []);

  const getActiveComplaints = useCallback(() => {
    return useAppSelector(selectActiveComplaints);
  }, []);

  const getRecentUpdates = useCallback(() => {
    return useAppSelector(selectRecentUpdates);
  }, []);

  // Data freshness checking
  const isDataFresh = useCallback((dataPath: string) => {
    return useAppSelector(selectIsDataFresh(dataPath));
  }, []);

  return {
    // Cache functions
    cacheComplaintsList,
    cacheComplaintDetails,
    updateComplaint,
    cacheWards,
    cacheComplaintTypes,
    cacheComplaintStats,
    cacheActiveComplaints,
    cacheRecentUpdates,
    clearStale,
    
    // Getter functions
    getComplaintsList,
    getComplaintDetails,
    getWards,
    getComplaintTypes,
    getComplaintStats,
    getActiveComplaints,
    getRecentUpdates,
    
    // Utility functions
    isDataFresh,
  };
};

// Hook for status tracking specifically
export const useStatusTracking = () => {
  const dispatch = useAppDispatch();
  const activeComplaints = useAppSelector(selectActiveComplaints);
  const recentUpdates = useAppSelector(selectRecentUpdates);

  const updateStatus = useCallback((complaintId: string, status: string, comment?: string) => {
    // Update the complaint in the centralized store
    dispatch(updateComplaintInList({ 
      id: complaintId, 
      updates: { 
        status,
        lastUpdated: new Date().toISOString(),
        ...(comment && { latestComment: comment })
      }
    }));

    // Add to recent updates
    const newUpdate = {
      id: `${complaintId}_${Date.now()}`,
      complaintId,
      status,
      comment,
      timestamp: new Date().toISOString(),
    };

    const currentUpdates = recentUpdates?.data || [];
    dispatch(setRecentUpdates([newUpdate, ...currentUpdates.slice(0, 49)])); // Keep last 50 updates
  }, [dispatch, recentUpdates]);

  const getComplaintStatus = useCallback((complaintId: string) => {
    const complaint = useAppSelector(selectComplaintDetails(complaintId));
    return complaint?.data?.status;
  }, []);

  const getStatusHistory = useCallback((complaintId: string) => {
    const updates = recentUpdates?.data || [];
    return updates.filter(update => update.complaintId === complaintId);
  }, [recentUpdates]);

  return {
    activeComplaints: activeComplaints?.data || [],
    recentUpdates: recentUpdates?.data || [],
    updateStatus,
    getComplaintStatus,
    getStatusHistory,
  };
};

// Hook for real-time data synchronization
export const useDataSync = () => {
  const { clearStale, isDataFresh } = useDataManager();

  const syncData = useCallback(async () => {
    // Clear stale data first
    clearStale();
    
    // Could trigger refetch of stale data here
    console.log('Data synchronization completed');
  }, [clearStale]);

  const checkDataFreshness = useCallback((paths: string[]) => {
    return paths.reduce((acc, path) => {
      acc[path] = isDataFresh(path);
      return acc;
    }, {} as Record<string, boolean>);
  }, [isDataFresh]);

  return {
    syncData,
    checkDataFreshness,
  };
};
