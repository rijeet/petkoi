const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const err = new Error('Failed to refresh session');
        (err as any).status = response.status;
        throw err;
      }

      const data = await response.json();
      const accessToken = data?.accessToken as string | undefined;
      if (!accessToken) {
        throw new Error('No access token returned from refresh');
      }

      this.token = accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', accessToken);
      }
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const execute = async (): Promise<T> => {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
        try {
          const txt = await response.text();
          if (txt) {
            errorMessage = txt;
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      if (response.status === 204) {
        return null as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return null as T;
    };

    let attemptedRefresh = false;
    try {
      return await execute();
    } catch (err: any) {
      if (!attemptedRefresh && err?.status === 401) {
        attemptedRefresh = true;
        await this.refreshAccessToken();
        return execute();
      }
      throw err;
    }
  }

  // Auth
  async googleAuth() {
    window.location.href = `${this.baseUrl}/auth/google`;
  }

  async logout() {
    await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // swallow errors to allow client-side cleanup regardless
    });
  }

  // Users
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Pets
  async getPets() {
    return this.request('/pets');
  }

  async getPet(id: string) {
    return this.request(`/pets/${id}`);
  }

  async getPublicPet(id: string) {
    return this.request(`/pets/public/${id}`);
  }

  async createPet(data: any) {
    return this.request('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePet(id: string, data: any) {
    return this.request(`/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePet(id: string) {
    return this.request(`/pets/${id}`, {
      method: 'DELETE',
    });
  }

  async setPetLostStatus(id: string, isLost: boolean) {
    return this.request(`/pets/${id}/lost`, {
      method: 'PATCH',
      body: JSON.stringify({ isLost }),
    });
  }

  async getPetQRCode(id: string) {
    return this.request(`/pets/${id}/qr`);
  }

  // Pet Images
  async uploadPetImage(petId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseUrl}/pets/${petId}/images`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Upload failed: ${String(err)}`);
    }
  }

  async getPetImages(petId: string) {
    return this.request(`/pets/${petId}/images`);
  }

  async deletePetImage(petId: string, imageId: string) {
    const url = `${this.baseUrl}/pets/${petId}/images/${imageId}`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }

  // GPS Location
  async recordGPSLocation(petId: string, lat: number, lng: number, note?: string) {
    return this.request(`/pets/${petId}/gps`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, note }),
    });
  }

  async getGPSHistory(petId: string, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return this.request(`/pets/${petId}/gps/history${query ? `?${query}` : ''}`);
  }

  async getLastGPSLocation(petId: string) {
    return this.request(`/pets/${petId}/gps/last`);
  }

  async findNearbyPets(lat: number, lng: number, radiusKm?: number) {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
    if (radiusKm) params.append('radiusKm', radiusKm.toString());
    return this.request(`/pets/gps/nearby?${params.toString()}`);
  }

  async reportPetFound(
    petId: string,
    lat: number,
    lng: number,
    address: string,
    note?: string,
    imageUrl?: string,
    phone?: string,
  ) {
    return this.request(`/pets/${petId}/found`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, address, note, imageUrl, phone }),
    });
  }

  // Orders
  async createOrder(payload: import('./api-types').CreateOrderRequest) {
    return this.request<import('./api-types').CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getOrder(orderNo: string) {
    return this.request<import('./api-types').Order>(`/orders/${orderNo}`);
  }

  async createSslSession(orderNo: string, opts?: { successUrl?: string; failUrl?: string; cancelUrl?: string }) {
    return this.request('/payments/sslcommerz/session', {
      method: 'POST',
      body: JSON.stringify({ orderNo, ...opts }),
    });
  }

  async submitManualPayment(payload: import('./api-types').ManualPaymentRequest) {
    return this.request<import('./api-types').ManualPaymentResponse>('/payments/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin auth
  async adminLogin(email: string, password: string) {
    return this.request<{ otpToken: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async adminVerify(otpToken: string, code: string) {
    return this.request<{ accessToken: string; role: string; expiresIn: number }>('/admin/login/verify', {
      method: 'POST',
      body: JSON.stringify({ otpToken, code }),
    });
  }

  async adminLogout() {
    await this.request('/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }

  async adminResendOtp(otpToken: string) {
    return this.request('/admin/login/resend', {
      method: 'POST',
      body: JSON.stringify({ otpToken }),
    });
  }

  // Admin data
  async adminListOrders(params?: { orderNo?: string; status?: string; userEmail?: string }) {
    const search = new URLSearchParams();
    if (params?.orderNo) search.set('orderNo', params.orderNo);
    if (params?.status) search.set('status', params.status);
    if (params?.userEmail) search.set('userEmail', params.userEmail);
    const qs = search.toString();
    return this.request(`/admin/orders${qs ? `?${qs}` : ''}`);
  }

  async adminGetOrder(orderNo: string) {
    return this.request(`/admin/orders/${orderNo}`);
  }

  async adminUpdateTracking(orderNo: string, payload: { status: string; description?: string }) {
    return this.request(`/admin/orders/${orderNo}/tracking`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adminUpdateStatus(orderNo: string, status: string) {
    return this.request(`/admin/orders/${orderNo}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async adminListUsers() {
    return this.request('/admin/admin-users');
  }

  async adminListLostPets() {
    return this.request('/admin/lost-pets');
  }

  async adminStats() {
    return this.request('/admin/stats');
  }

  async adminListTables() {
    return this.request('/admin/schema/tables');
  }

  // Notifications
  async getNotifications(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Community Posts
  async createPost(data: {
    title: string;
    body: string;
    imageUrl?: string;
    location?: { lat: number; lng: number; address?: string };
    tags?: string[];
  }) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPosts(limit?: number, offset?: number, tag?: string, authorId?: string) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (tag) params.append('tag', tag);
    if (authorId) params.append('authorId', authorId);
    const query = params.toString();
    return this.request(`/community/posts${query ? `?${query}` : ''}`);
  }

  async getPost(id: string) {
    return this.request(`/community/posts/${id}`);
  }

  async updatePost(id: string, data: {
    title?: string;
    body?: string;
    imageUrl?: string;
    location?: { lat: number; lng: number; address?: string };
    tags?: string[];
  }) {
    return this.request(`/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string) {
    return this.request(`/community/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async upvotePost(id: string) {
    return this.request(`/community/posts/${id}/upvote`, {
      method: 'POST',
    });
  }

  async downvotePost(id: string) {
    return this.request(`/community/posts/${id}/downvote`, {
      method: 'POST',
    });
  }

  // Community Comments
  async createComment(postId: string, content: string, parentId?: string) {
    return this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  async getComments(postId: string, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return this.request(`/community/posts/${postId}/comments${query ? `?${query}` : ''}`);
  }

  async deleteComment(commentId: string) {
    return this.request(`/community/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Directory - Guards
  async createGuard(data: { name: string; phone: string; address: string }) {
    return this.request('/directory/guards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGuards(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return this.request(`/directory/guards${query ? `?${query}` : ''}`);
  }

  async getGuard(id: string) {
    return this.request(`/directory/guards/${id}`);
  }

  async findNearbyGuards(lat: number, lng: number, radiusKm?: number) {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
    if (radiusKm) params.append('radiusKm', radiusKm.toString());
    return this.request(`/directory/guards/nearby?${params.toString()}`);
  }

  async updateGuard(id: string, data: { name?: string; phone?: string; address?: string }) {
    return this.request(`/directory/guards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGuard(id: string) {
    return this.request(`/directory/guards/${id}`, {
      method: 'DELETE',
    });
  }

  // Directory - Waste Collectors
  async createWasteCollector(data: { name: string; phone: string; ward: string }) {
    return this.request('/directory/waste-collectors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWasteCollectors(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString();
    return this.request(`/directory/waste-collectors${query ? `?${query}` : ''}`);
  }

  async getWasteCollectorsByWard(ward: string) {
    return this.request(`/directory/waste-collectors/ward/${ward}`);
  }

  async getWasteCollector(id: string) {
    return this.request(`/directory/waste-collectors/${id}`);
  }

  async updateWasteCollector(id: string, data: { name?: string; phone?: string; ward?: string }) {
    return this.request(`/directory/waste-collectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWasteCollector(id: string) {
    return this.request(`/directory/waste-collectors/${id}`, {
      method: 'DELETE',
    });
  }

  // Pet Tag Orders
  async createPetTagOrder(petId: string, tagColor: string, tagSize?: string) {
    return this.request('/pet-tags/order', {
      method: 'POST',
      body: JSON.stringify({ petId, tagColor, tagSize }),
    });
  }

  async getMyPetTagOrders() {
    return this.request('/pet-tags/my-orders');
  }

  async getPetTagOrder(orderId: string) {
    return this.request(`/pet-tags/order/${orderId}`);
  }

  async updatePetTagOrderStatus(orderId: string, status: string) {
    return this.request(`/pet-tags/order/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Orders
  async getOrders() {
    return this.request('/orders');
  }
}

export const apiClient = new ApiClient();

