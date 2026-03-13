const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new ApiError(response.status, error.detail || "An error occurred");
  }
  return response.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ admin_id: string; full_name: string; token: string }>(response);
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/me`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ id: string; username: string; full_name: string }>(response);
  },

  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ users: import("./types").User[] }>(response);
  },

  getUser: async (studentId: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<import("./types").User>(response);
  },

  createUser: async (data: { student_id: number; first_name: string; last_name: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<import("./types").User>(response);
  },

  setUserStatus: async (studentId: number, status: "active" | "inactive") => {
    const response = await fetch(`${API_BASE_URL}/users/${studentId}/status?status=${status}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ ok: boolean; student_id: number; status: string }>(response);
  },

  // Purchases
  getPurchases: async () => {
    const response = await fetch(`${API_BASE_URL}/purchases/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ purchases: import("./types").Purchase[] }>(response);
  },

  // Payments
  getPayments: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ payments: import("./types").Payment[] }>(response);
  },

  createPayment: async (data: { student_id: number; amount_paid: number }) => {
    const response = await fetch(`${API_BASE_URL}/payments/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<import("./types").Payment>(response);
  },

  // IC Cards
  getICCards: async () => {
    const response = await fetch(`${API_BASE_URL}/ic-cards/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ iccards: import("./types").ICCard[] }>(response);
  },

  // Shelves
  getShelves: async () => {
    const response = await fetch(`${API_BASE_URL}/shelves/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ shelves: import("./types").Shelf[] }>(response);
  },

  createShelf: async (data: { shelf_id: string; usb_port: number; price: number }) => {
    const response = await fetch(`${API_BASE_URL}/shelves/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<import("./types").Shelf>(response);
  },

  // Admin Logs
  getAdminLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/admin-logs/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ logs: import("./types").AdminLog[] }>(response);
  },

  // System Settings
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ settings: import("./types").SystemSetting[] }>(response);
  },

  updateSetting: async (key: string, value: string) => {
    const response = await fetch(`${API_BASE_URL}/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ value }),
    });
    return handleResponse<import("./types").SystemSetting>(response);
  },
};

export { ApiError };
