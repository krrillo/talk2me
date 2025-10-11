import { useAuthStore } from "./stores/useAuthStore";

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function getAuthToken(): string | null {
  const user = useAuthStore.getState().user;
  
  if (!user) {
    return null;
  }
  
  // Validate UUID, if invalid clear the user and force re-login
  if (!isValidUUID(user.id)) {
    console.warn("Invalid user ID detected, clearing session");
    useAuthStore.getState().logout();
    return null;
  }
  
  return `${user.username}:${user.id}:${user.level}`;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}
