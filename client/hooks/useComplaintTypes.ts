import { useMemo } from "react";
import { useGetComplaintTypesQuery } from "../store/api/complaintTypesApi";

export interface ComplaintTypeOption {
  value: string;
  label: string;
  description?: string;
  priority?: string;
  slaHours?: number;
}

export const useComplaintTypes = () => {
  const { data: response, isLoading, error } = useGetComplaintTypesQuery();

  const complaintTypes = useMemo(() => {
    if (!response?.data) return [];
    return response.data;
  }, [response]);

  const complaintTypeOptions = useMemo(() => {
    if (!response?.data) return [];

    return response.data
      .filter((type) => type.isActive)
      .map((type) => ({
        value: type.id.toUpperCase(),
        label: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
      }));
  }, [response]);

  const getComplaintTypeById = (id: string) => {
    return complaintTypes.find((type) => type.id === id);
  };

  const getComplaintTypeByName = (name: string) => {
    return complaintTypes.find((type) => type.name === name);
  };

  return {
    complaintTypes,
    complaintTypeOptions,
    isLoading,
    error,
    getComplaintTypeById,
    getComplaintTypeByName,
  };
};
