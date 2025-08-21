import { format, parseISO, isValid } from "date-fns";

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return "Invalid Date";
    }
    return format(dateObj, "MMM dd, yyyy");
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "Invalid Date";
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return "Invalid Date";
    }
    return format(dateObj, "MMM dd, yyyy HH:mm");
  } catch (error) {
    console.warn("Error formatting datetime:", date, error);
    return "Invalid Date";
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return "Invalid Date";
    }

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.warn("Error formatting relative time:", date, error);
    return "Invalid Date";
  }
};
