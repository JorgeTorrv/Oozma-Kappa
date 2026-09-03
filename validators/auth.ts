import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe tu correo.")
    .email("Correo no válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;
