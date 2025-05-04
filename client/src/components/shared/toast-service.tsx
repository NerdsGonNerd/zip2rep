import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Custom toast service for the application
export const useToastService = () => {
  const { toast } = useToast();

  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  };

  const showError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const showWarning = (message: string) => {
    toast({
      title: "Warning",
      description: message,
      variant: "destructive",
    });
  };

  const showInfo = (message: string) => {
    toast({
      title: "Information",
      description: message,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Global error handler for API calls
export const setupGlobalErrorHandler = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch(input, init);
      if (!response.ok && response.status >= 500) {
        toast({
          title: "Error",
          description: "Unexpected error, please try again",
          variant: "destructive",
        });
      }
      return response;
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error, please check your connection",
        variant: "destructive",
      });
      throw error;
    }
  };
};
