"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "../../actions/registerAction";

export interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export function useRegister() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const register = async (data: RegisterFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            // Client-side validation
            if (!data.username || !data.email || !data.password) {
                setError("All fields are required");
                setIsLoading(false);
                return;
            }

            if (data.password.length < 8) {
                setError("Password must be at least 8 characters");
                setIsLoading(false);
                return;
            }

            if (data.confirmPassword && data.password !== data.confirmPassword) {
                setError("Passwords do not match");
                setIsLoading(false);
                return;
            }

            const result = await registerAction({
                username: data.username,
                email: data.email,
                password: data.password,
            });

            if (!result.success) {
                setError(result.error || "Registration failed");
                return;
            }

            // Redirect on success
            router.push("/user/login");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "An unexpected error occurred"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        register,
        error,
        isLoading,
    };
}
