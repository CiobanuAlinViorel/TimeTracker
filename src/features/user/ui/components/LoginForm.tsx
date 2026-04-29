"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../hooks/useLogin";

export function LoginForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const { login, error, isLoading } = useLogin();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await login(formData);
    };

    return (
        <main className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm rounded-xl border p-8 shadow-md">
                <h1 className="mb-6 text-2xl font-bold">Sign in</h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-md bg-black py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a href="/user/register" className="font-medium text-black hover:underline">
                        Create one
                    </a>
                </p>
            </div>
        </main>
    );
}
