import * as React from "react";
import { assignmentService, AssignmentService } from "@/services/assignment-service";

// Context type definition
interface AssignmentContextType {
  service: AssignmentService;
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create context with default values
const AssignmentContext = React.createContext<AssignmentContextType>({
  service: assignmentService,
  loading: false,
  error: null,
  setLoading: () => {},
  setError: () => {},
});

// Provider component
export const AssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const value = {
    service: assignmentService,
    loading,
    error,
    setLoading,
    setError,
  };
  
  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
};

// Custom hook to use the assignment context
export const useAssignment = () => {
  const context = React.useContext(AssignmentContext);
  
  if (context === undefined) {
    throw new Error("useAssignment must be used within an AssignmentProvider");
  }
  
  return context;
};
