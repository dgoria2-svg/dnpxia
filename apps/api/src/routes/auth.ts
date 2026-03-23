import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, toAuthUser, verifyPassword } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) {
      return reply.conflict('A user with that email already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
      },
    });

    const authUser = await toAuthUser(user);
    const accessToken = await reply.jwtSign({ sub: user.id, email: user.email });

    return reply.code(201).send({ accessToken, user: authUser });
  });

  app.post('/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return reply.unauthorized('Invalid credentials.');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      return reply.unauthorized('Invalid credentials.');
    }

    const authUser = await toAuthUser(user);
    const accessToken = await reply.jwtSign({ sub: user.id, email: user.email });

    return { accessToken, user: authUser };
  });
}
