import { API_URL } from '../config';

export type AuthUser = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

function isEmail(value: string) {
  return value.trim().includes('@');
}

async function parseJsonResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function registerUser({
  fullName,
  phoneOrEmail,
  password,
}: {
  fullName: string;
  phoneOrEmail: string;
  password: string;
}): Promise<RegisterResponse> {
  const identifier = phoneOrEmail.trim();
  const body: Record<string, string> = {
    fullName: fullName.trim(),
    password,
  };

  if (isEmail(identifier)) {
    body.email = identifier.toLowerCase();
  } else {
    body.phoneNumber = identifier;
  }

  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
}

export async function loginUser({
  phoneOrEmail,
  password,
}: {
  phoneOrEmail: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier: phoneOrEmail.trim(),
      password,
    }),
  });

  return parseJsonResponse(response);
}
