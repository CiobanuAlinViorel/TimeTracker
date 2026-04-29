import "server-only";

import prisma from "@/lib/prisma";

export interface UserCreateInput {
    username: string;
    email: string;
    password: string;
}

export interface UserData {
    id: string;
    username: string;
    email: string;
    password: string;
}

export class UserRepository {
    async create(data: UserCreateInput): Promise<UserData> {
        return prisma.user.create({
            data,
        });
    }

    async getById(id: string): Promise<UserData | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async getByEmail(email: string): Promise<UserData | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async getByUsername(username: string): Promise<UserData | null> {
        return prisma.user.findUnique({
            where: { username },
        });
    }

    async existsByEmailOrUsername(
        email: string,
        username: string
    ): Promise<boolean> {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        return !!user;
    }
}
