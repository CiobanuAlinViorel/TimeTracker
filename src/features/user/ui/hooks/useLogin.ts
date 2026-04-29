"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "../../actions/loginAction";

export interface LoginFormData {
    email: string;
    password: string;
}

export function useLogin() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const login = async (data: LoginFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            // Client-side validation
            if (!data.email || !data.password) {
                setError("Email and password are required");
                setIsLoading(false);
                return;
            }

            const result = await loginAction(data.email, data.password);

            if (!result.success) {
                setError(result.error || "Login failed");
                return;
            }

            // Redirect on success
            router.push("/");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "An unexpected error occurred"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        error,
        isLoading,
    };
}
