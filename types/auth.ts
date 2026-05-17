export interface User {
  id: number;
  full_name: string;
  email: string;
  role_name: string;
  permissions?: string[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user: User;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
