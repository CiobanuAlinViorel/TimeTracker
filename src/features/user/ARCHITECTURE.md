# User Authentication Architecture

This document describes the layered architecture for user authentication in the time-tracker application.

## Architecture Layers

### 1. Repository Layer (`/repositories/UserRepository.ts`)

**Purpose**: Data access layer that abstracts Prisma database operations.

**Key Features**:
- `create()` - Create a new user
- `getById()` - Fetch user by ID
- `getByEmail()` - Fetch user by email
- `getByUsername()` - Fetch user by username
- `existsByEmailOrUsername()` - Check if user exists

**Usage**: Only used by the Service layer. Should not be imported directly in components or hooks.

---

### 2. Service Layer (`/services/UserService.ts`)

**Purpose**: Business logic layer that orchestrates repository operations and implements application rules.

**Key Features**:
- `register()` - Handles user registration with validation and password hashing
- `validateCredentials()` - Authenticates user by email/password
- `getUserById()` - Retrieves user information by ID

**Key Responsibility**:
- Input validation
- Password hashing (bcryptjs)
- Error handling
- Returns sanitized user data (without password)

**Usage**: Used by server actions. Can be instantiated anywhere on the server.

---

### 3. Actions Layer (`/actions/`)

**Purpose**: Server actions that bridge server-side business logic with client-side components.

**Files**:
- `registerAction.ts` - Server action for user registration
- `loginAction.ts` - Server action for user login (delegates to NextAuth)

**Key Characteristics**:
- All functions have `"use server"` directive
- Receive data from client
- Call service methods
- Return results to client
- Handle redirects or throw errors

**Usage**: Called from client-side hooks.

---

### 4. Hooks Layer (`/ui/hooks/`)

**Purpose**: Client-side hooks that manage form state and server action invocation.

**Files**:
- `useRegister.ts` - Hook for registration form
- `useLogin.ts` - Hook for login form

**Key Features**:
- State management (error, isLoading)
- Client-side validation
- Call server actions
- Handle redirects
- Provide loading states to components

**Usage**: Used directly in client components.

---

### 5. Component Layer (`/ui/components/`)

**Purpose**: UI components that render forms and use hooks.

**Files**:
- `RegisterForm.tsx` - Registration form component
- `LoginForm.tsx` - Login form component

**Key Characteristics**:
- "use client" components
- Use hooks for logic
- Handle form state (controlled inputs)
- Display errors and loading states
- Provide user interactions (onClick, onChange, etc.)

**Usage**: Imported in page components.

---

## Data Flow

### Registration Flow

```
Component (RegisterForm)
    ↓
Hook (useRegister) - manages form state, validation
    ↓
Action (registerAction) - "use server"
    ↓
Service (UserService.register())
    ↓
Repository (UserRepository.create())
    ↓
Prisma/Database
```

### Login Flow

```
Component (LoginForm)
    ↓
Hook (useLogin) - manages form state, validation
    ↓
Action (loginAction) - "use server"
    ↓
NextAuth signIn() / Service validation
    ↓
Prisma/Database
```

---

## Usage Examples

### Creating a New User Feature

If you need to extend user functionality:

1. **Add repository method** in `UserRepository.ts`:
   ```typescript
   async updateProfile(id: string, data: Partial<UserData>) {
     return prisma.user.update({ where: { id }, data });
   }
   ```

2. **Add service method** in `UserService.ts`:
   ```typescript
   async updateProfile(id: string, data: ProfileUpdateInput) {
     // validation logic
     return this.userRepository.updateProfile(id, data);
   }
   ```

3. **Create action** in `/actions/updateProfileAction.ts`:
   ```typescript
   export async function updateProfileAction(id: string, data: ProfileUpdateInput) {
     const userService = new UserService();
     return userService.updateProfile(id, data);
   }
   ```

4. **Create hook** in `/ui/hooks/useUpdateProfile.ts`:
   ```typescript
   export function useUpdateProfile() {
     const [error, setError] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(false);

     const updateProfile = async (id: string, data: ProfileUpdateInput) => {
       setIsLoading(true);
       try {
         const result = await updateProfileAction(id, data);
         // handle result
       } finally {
         setIsLoading(false);
       }
     };

     return { updateProfile, error, isLoading };
   }
   ```

5. **Use in component**:
   ```typescript
   export function ProfileForm() {
     const { updateProfile, isLoading, error } = useUpdateProfile();
     // render form
   }
   ```

---

## Key Principles

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Single Responsibility**: Each file/function does one thing well
3. **Data Sanitization**: Never return passwords or sensitive data
4. **Error Handling**: Errors are caught at service level and returned to client
5. **Validation**: Validation happens at both service (backend) and hook (frontend) levels
6. **Security**: Passwords are hashed, credentials validated server-side

---

## File Structure

```
src/features/user/
├── actions/
│   ├── registerAction.ts
│   └── loginAction.ts
├── repositories/
│   └── UserRepository.ts
├── services/
│   └── UserService.ts
└── ui/
    ├── components/
    │   ├── RegisterForm.tsx
    │   └── LoginForm.tsx
    └── hooks/
        ├── useRegister.ts
        └── useLogin.ts
```

---

## Testing Strategy

- **Repository**: Mock Prisma calls
- **Service**: Mock Repository methods
- **Actions**: Mock Service calls
- **Hooks**: Mock Actions
- **Components**: Mock Hooks with React Testing Library

---

## Security Considerations

- ✅ Passwords are hashed with bcryptjs (12 rounds)
- ✅ Password validation happens server-side in UserService
- ✅ NextAuth handles session management
- ✅ Credentials provider only accepts email/password
- ✅ User data returned to client excludes password field
