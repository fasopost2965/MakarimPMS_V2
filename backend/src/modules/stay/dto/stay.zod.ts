import { z } from 'zod';

export const walkinZodSchema = z.object({
  roomId: z.coerce.number(),
  guestId: z.coerce.number().optional(),
  guest: z
    .object({
      nom: z.string(),
      prenom: z.string(),
      telephone: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  dateArrivee: z.string(),
  dateCheckoutPrevue: z.string(),
  formuleHebergement: z.string().optional(),
});

export const forceCheckoutZodSchema = z.object({
  force: z.boolean().optional(),
  motif: z.string().optional(),
});

export const shortenStayZodSchema = z.object({
  dateCheckoutPrevue: z.string(),
  motif: z
    .string()
    .min(10, 'Le motif de l’écourtement doit contenir au moins 10 caractères.'),
});
