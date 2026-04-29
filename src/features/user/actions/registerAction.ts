"use server";

import { UserService, type RegisterInput } from "../services/UserService";

export async function registerAction(input: RegisterInput) {
    const userService = new UserService();
    return userService.register(input);
}
