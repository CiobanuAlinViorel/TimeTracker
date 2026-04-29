"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRegister } from "../hooks/useRegister";

export function RegisterForm() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const { register, error, isLoading } = useRegister();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await register(formData);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
            <div className="w-full max-w-md rounded-[28px] border border-[var(--brand-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(237,244,233,0.96))] p-6 shadow-[0_20px_50px_rgba(36,89,47,0.12)] sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <Image
                        src="/logo.svg"
                        alt="Time Tracker logo"
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-2xl"
                        priority
                    />
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--brand)]">
                            Time Tracker
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--brand-deep)]">
                            Create account
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-2xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger-strong)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="username" className="text-sm font-medium text-[var(--brand-deep)]">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="rounded-2xl border border-[var(--brand-line)] bg-white px-3 py-3 text-sm text-[var(--brand-deep)] outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-[var(--brand-deep)]">
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
                            className="rounded-2xl border border-[var(--brand-line)] bg-white px-3 py-3 text-sm text-[var(--brand-deep)] outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium text-[var(--brand-deep)]">
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
                            className="rounded-2xl border border-[var(--brand-line)] bg-white px-3 py-3 text-sm text-[var(--brand-deep)] outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
                        />
                        <p className="text-xs text-[color:rgba(25,52,31,0.6)]">Minimum 8 characters</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--brand-deep)]">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="rounded-2xl border border-[var(--brand-line)] bg-white px-3 py-3 text-sm text-[var(--brand-deep)] outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-2xl bg-[var(--brand)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)] disabled:opacity-50"
                    >
                        {isLoading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[color:rgba(25,52,31,0.72)]">
                    Already have an account?{" "}
                    <Link href="/user/login" className="font-medium text-[var(--brand)] hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
