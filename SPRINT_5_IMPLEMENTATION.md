# Sprint 5 Implementation Summary

## Overview
This document summarizes the implementation of Sprint 5 features: Community posts, comments, and directory management (guards and waste collectors) with admin forms.

## Backend Implementation

### 1. Community Service (`backend/src/APP.BLL/services/community.service.ts`)
- **createPost()**: Create a new community post
  - Includes author information
  - Supports tags, location, and image URL
  - Returns post with author and recent comments

- **getPosts()**: Get all posts with pagination and filters
  - Filter by tag
  - Filter by author
  - Pagination support (limit/offset)
  - Returns posts with author and recent comments

- **getPostById()**: Get a single post with all comments
  - Includes nested comment structure
  - Returns author information

- **updatePost()**: Update a post (author only)
  - Validates ownership
  - Updates title, body, image, location, tags

- **deletePost()**: Delete a post (author only)
  - Validates ownership
  - Cascades to delete all comments

- **upvotePost()**: Increment upvote count
- **downvotePost()**: Increment downvote count

- **createComment()**: Create a comment on a post
  - Supports nested comments (parentId)
  - Validates parent comment belongs to same post
  - Returns comment with author information

- **getComments()**: Get all comments for a post
  - Pagination support
  - Ordered by creation date

- **deleteComment()**: Delete a comment (author only)
  - Validates ownership

### 2. Community Controller (`backend/src/APP.API/community/community.controller.ts`)
- **POST /community/posts**: Create post (authenticated)
- **GET /community/posts**: List posts (public, with filters)
- **GET /community/posts/:id**: Get single post (public)
- **PUT /community/posts/:id**: Update post (authenticated, author only)
- **DELETE /community/posts/:id**: Delete post (authenticated, author only)
- **POST /community/posts/:id/upvote**: Upvote post (public)
- **POST /community/posts/:id/downvote**: Downvote post (public)
- **POST /community/posts/:id/comments**: Create comment (authenticated)
- **GET /community/posts/:id/comments**: Get comments (public)
- **DELETE /community/comments/:id**: Delete comment (authenticated, author only)

### 3. Directory Service (`backend/src/APP.BLL/services/directory.service.ts`)
- **Guard Management**:
  - `createGuard()`: Create new guard (admin only)
  - `getGuards()`: Get all guards with pagination
  - `getGuardById()`: Get single guard
  - `updateGuard()`: Update guard (admin only)
  - `deleteGuard()`: Delete guard (admin only)
  - `findNearbyGuards()`: Find guards near location (TODO: geocoding)

- **Waste Collector Management**:
  - `createWasteCollector()`: Create new collector (admin only)
  - `getWasteCollectors()`: Get all collectors with pagination
  - `getWasteCollectorById()`: Get single collector
  - `getWasteCollectorsByWard()`: Get collectors by ward
  - `updateWasteCollector()`: Update collector (admin only)
  - `deleteWasteCollector()`: Delete collector (admin only)

### 4. Directory Controller (`backend/src/APP.API/directory/directory.controller.ts`)
- **Guard Endpoints**:
  - `POST /directory/guards`: Create guard (admin only)
  - `GET /directory/guards`: List guards (public)
  - `GET /directory/guards/:id`: Get guard (public)
  - `GET /directory/guards/nearby`: Find nearby guards (public)
  - `PUT /directory/guards/:id`: Update guard (admin only)
  - `DELETE /directory/guards/:id`: Delete guard (admin only)

- **Waste Collector Endpoints**:
  - `POST /directory/waste-collectors`: Create collector (admin only)
  - `GET /directory/waste-collectors`: List collectors (public)
  - `GET /directory/waste-collectors/ward/:ward`: Get by ward (public)
  - `GET /directory/waste-collectors/:id`: Get collector (public)
  - `PUT /directory/waste-collectors/:id`: Update collector (admin only)
  - `DELETE /directory/waste-collectors/:id`: Delete collector (admin only)

### 5. Admin Guard (`backend/src/common/guards/admin.guard.ts`)
- Role-based access control
- Checks user role from database
- Throws ForbiddenException if user is not ADMIN
- Used to protect directory management endpoints

### 6. DTOs
- **Community DTOs** (`backend/src/APP.Shared/dtos/community.dto.ts`):
  - `CreateCommunityPostDto`: Title, body, imageUrl, location, tags
  - `UpdateCommunityPostDto`: Optional fields for updates
  - `CreateCommentDto`: Content, optional parentId for nesting
  - `GetPostsDto`: Pagination and filter parameters

- **Directory DTOs** (`backend/src/APP.Shared/dtos/directory.dto.ts`):
  - `CreateGuardDto`: Name, phone, address
  - `UpdateGuardDto`: Optional fields
  - `CreateWasteCollectorDto`: Name, phone, ward
  - `UpdateWasteCollectorDto`: Optional fields
  - `FindNearbyGuardsDto`: Lat, lng, radiusKm

## Frontend Implementation

### 1. API Client Updates (`frontend/src/lib/api.ts`)
- **Community Methods**:
  - `createPost()`: Create new post
  - `getPosts()`: Get posts with filters
  - `getPost()`: Get single post
  - `updatePost()`: Update post
  - `deletePost()`: Delete post
  - `upvotePost()`: Upvote post
  - `downvotePost()`: Downvote post
  - `createComment()`: Create comment
  - `getComments()`: Get comments
  - `deleteComment()`: Delete comment

- **Directory Methods**:
  - `createGuard()`: Create guard (admin)
  - `getGuards()`: Get guards
  - `getGuard()`: Get single guard
  - `findNearbyGuards()`: Find nearby guards
  - `updateGuard()`: Update guard (admin)
  - `deleteGuard()`: Delete guard (admin)
  - `createWasteCollector()`: Create collector (admin)
  - `getWasteCollectors()`: Get collectors
  - `getWasteCollectorsByWard()`: Get by ward
  - `getWasteCollector()`: Get single collector
  - `updateWasteCollector()`: Update collector (admin)
  - `deleteWasteCollector()`: Delete collector (admin)

### 2. Frontend Components
- **CommunityPostForm** (`frontend/src/components/CommunityPostForm.tsx`):
  - Form for creating/editing posts
  - Fields: title, body, imageUrl, tags
  - Validation and error handling
  - Success callback

- **GuardForm** (`frontend/src/components/GuardForm.tsx`):
  - Form for creating/editing guards
  - Fields: name, phone, address
  - Admin-only functionality
  - Update mode support

- **WasteCollectorForm** (`frontend/src/components/WasteCollectorForm.tsx`):
  - Form for creating/editing waste collectors
  - Fields: name, phone, ward
  - Admin-only functionality
  - Update mode support

## Database Schema

The following tables already exist in the migration:
- **community_posts**: id, authorId, title, body, imageUrl, location (JSON), tags (array), upvotes, downvotes, createdAt
- **community_comments**: id, postId, authorId, content, parentId, createdAt
- **guards**: id, name, phone, address, createdAt
- **waste_collectors**: id, name, phone, ward, createdAt

## Security Features

1. **Authentication**: Most endpoints require JWT authentication
2. **Authorization**: 
   - Post/comment updates/deletes require ownership
   - Directory management requires ADMIN role
3. **Public Endpoints**: 
   - Viewing posts and comments (public)
   - Viewing directory entries (public)
   - Upvoting/downvoting (public)
4. **Admin Guard**: Protects directory management endpoints

## API Endpoints Summary

### Community
```
POST   /community/posts              - Create post (auth)
GET    /community/posts              - List posts (public, filters)
GET    /community/posts/:id          - Get post (public)
PUT    /community/posts/:id          - Update post (auth, owner)
DELETE /community/posts/:id          - Delete post (auth, owner)
POST   /community/posts/:id/upvote   - Upvote (public)
POST   /community/posts/:id/downvote - Downvote (public)
POST   /community/posts/:id/comments - Create comment (auth)
GET    /community/posts/:id/comments - Get comments (public)
DELETE /community/comments/:id      - Delete comment (auth, owner)
```

### Directory
```
POST   /directory/guards             - Create guard (admin)
GET    /directory/guards             - List guards (public)
GET    /directory/guards/:id         - Get guard (public)
GET    /directory/guards/nearby      - Find nearby (public)
PUT    /directory/guards/:id         - Update guard (admin)
DELETE /directory/guards/:id         - Delete guard (admin)

POST   /directory/waste-collectors   - Create collector (admin)
GET    /directory/waste-collectors   - List collectors (public)
GET    /directory/waste-collectors/ward/:ward - Get by ward (public)
GET    /directory/waste-collectors/:id - Get collector (public)
PUT    /directory/waste-collectors/:id - Update collector (admin)
DELETE /directory/waste-collectors/:id - Delete collector (admin)
```

## Usage Examples

### Create Community Post (Frontend)
```typescript
await apiClient.createPost({
  title: 'Lost Dog Found',
  body: 'Found a friendly golden retriever near the park...',
  tags: ['lost-pet', 'found'],
  imageUrl: 'https://example.com/image.jpg',
});
```

### Create Comment (Frontend)
```typescript
await apiClient.createComment(postId, 'Great news!', parentCommentId);
```

### Create Guard (Frontend - Admin)
```typescript
await apiClient.createGuard({
  name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main St, City',
});
```

### Create Waste Collector (Frontend - Admin)
```typescript
await apiClient.createWasteCollector({
  name: 'ABC Waste Services',
  phone: '+1234567890',
  ward: 'Ward 5',
});
```

## TODO / Future Enhancements

1. **Geocoding**: Implement address geocoding for guards to enable accurate nearby searches
2. **Comment Threading**: Enhance nested comment display in frontend
3. **Post Images**: Integrate ImageKit for post image uploads
4. **Vote Tracking**: Track individual user votes to prevent duplicate voting
5. **Post Moderation**: Add admin moderation capabilities
6. **Search**: Add full-text search for posts
7. **Notifications**: Notify users when their posts receive comments
8. **Rich Text**: Support markdown or rich text in posts
9. **Post Categories**: Add category system for better organization
10. **Guard/Waste Collector Verification**: Add verification system for directory entries

## Testing Checklist

- [ ] Create community post
- [ ] List posts with filters (tag, author)
- [ ] Get single post with comments
- [ ] Update post (as author)
- [ ] Delete post (as author)
- [ ] Upvote/downvote post
- [ ] Create comment
- [ ] Create nested comment
- [ ] Delete comment (as author)
- [ ] Create guard (as admin)
- [ ] List guards
- [ ] Update guard (as admin)
- [ ] Delete guard (as admin)
- [ ] Create waste collector (as admin)
- [ ] Get waste collectors by ward
- [ ] Update waste collector (as admin)
- [ ] Delete waste collector (as admin)
- [ ] Verify non-admin cannot access directory management
- [ ] Verify users can only edit/delete their own posts/comments

## Files Created/Modified

**Backend:**
- `backend/src/APP.Shared/dtos/community.dto.ts`
- `backend/src/APP.Shared/dtos/directory.dto.ts`
- `backend/src/APP.BLL/services/community.service.ts`
- `backend/src/APP.BLL/services/directory.service.ts`
- `backend/src/APP.API/community/community.controller.ts`
- `backend/src/APP.API/community/community.module.ts`
- `backend/src/APP.API/directory/directory.controller.ts`
- `backend/src/APP.API/directory/directory.module.ts`
- `backend/src/common/guards/admin.guard.ts`
- `backend/src/app.module.ts` (updated)

**Frontend:**
- `frontend/src/lib/api.ts` (updated)
- `frontend/src/components/CommunityPostForm.tsx`
- `frontend/src/components/GuardForm.tsx`
- `frontend/src/components/WasteCollectorForm.tsx`

