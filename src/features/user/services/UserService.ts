import "server-only";

import bcrypt from "bcryptjs";
import { UserRepository, type UserCreateInput, type UserData } from "../repositories/UserRepository";

export interface RegisterInput {
    username: string;
    email: string;
    password: string;
}

export interface AuthenticationResult {
    success: boolean;
    error?: string;
}

export interface UserInfo {
    id: string;
    username: string;
    email: string;
}

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async register(input: RegisterInput): Promise<AuthenticationResult> {
        try {
            // Validate input
            if (!input.username || !input.email || !input.password) {
                return {
                    success: false,
                    error: "Missing required fields",
                };
            }

            if (input.password.length < 8) {
                return {
                    success: false,
                    error: "Password must be at least 8 characters",
                };
            }

            // Check if user already exists
            const exists = await this.userRepository.existsByEmailOrUsername(
                input.email,
                input.username
            );

            if (exists) {
                return {
                    success: false,
                    error: "User with this email or username already exists",
                };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(input.password, 12);

            // Create user
            const userData: UserCreateInput = {
                username: input.username,
                email: input.email,
                password: hashedPassword,
            };

            await this.userRepository.create(userData);

            return {
                success: true,
            };
        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                error: "An error occurred during registration",
            };
        }
    }

    async validateCredentials(
        email: string,
        password: string
    ): Promise<UserInfo | null> {
        try {
            const user = await this.userRepository.getByEmail(email);

            if (!user) {
                return null;
            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return null;
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
            };
        } catch (error) {
            console.error("Authentication error:", error);
            return null;
        }
    }

    async getUserById(id: string): Promise<UserInfo | null> {
        try {
            const user = await this.userRepository.getById(id);

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
            };
        } catch (error) {
            console.error("Get user error:", error);
            return null;
        }
    }
}
