import { apiRequest } from "./queryClient";

// Token storage key
const TOKEN_KEY = "jwt_token";

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    // Basic validation of token expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < expiryTime;
  } catch (e) {
    // If there's any error in token parsing, clear it and return false
    localStorage.removeItem(TOKEN_KEY);
    return false;
  }
};

// Store JWT token
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Clear token on logout
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Get token for API requests
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Simple login function (simulated for this prototype)
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    // For the prototype, simulate a successful login with hardcoded credentials
    if (username === "admin" && password === "password") {
      // Simulate a JWT token (this would normally come from the server)
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.tbDepxpstvGdW8TC3G8zg4B6rUYAOvfzdceoH48wgRQ";
      setToken(mockToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
};

// Navigation guard - redirects to login if not authenticated
export const AuthGuard = (
  targetLocation: string,
  redirectTo: string = "/login"
): string => {
  if (!isAuthenticated()) {
    return redirectTo;
  }
  return targetLocation;
};
