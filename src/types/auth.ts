export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

