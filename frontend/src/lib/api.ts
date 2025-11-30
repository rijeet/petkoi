const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
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

    // Handle 204 No Content (DELETE operations)
    if (response.status === 204) {
      return null as T;
    }

    // Check if response has content to parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Return null for empty responses
    return null as T;
  }

  // Auth
  async googleAuth() {
    window.location.href = `${this.baseUrl}/auth/google`;
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
    const headers: HeadersInit = {};

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
    const headers: HeadersInit = {};

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
    address?: string,
    note?: string,
    imageUrl?: string,
  ) {
    return this.request(`/pets/${petId}/found`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, address, note, imageUrl }),
    });
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
}

export const apiClient = new ApiClient();

