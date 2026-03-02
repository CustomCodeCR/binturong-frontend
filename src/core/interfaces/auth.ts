export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  username: string;
  email: string;
  token: string;
  roles: string[];
  scopes: string[];
}
