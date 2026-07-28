import { z } from 'zod';
import { CanalReservation, FormuleHebergement } from '@prisma/client';

export const createReservationZodSchema = z.object({
  canal: z.nativeEnum(CanalReservation).optional(),
  roomId: z.coerce.number().int().positive(),
  dateArrivee: z.string().min(1),
  dateDepart: z.string().min(1),
  sourceBrute: z.string().optional(),
  formule: z.nativeEnum(FormuleHebergement).optional(),
  cancellationPolicyId: z.coerce.number().int().optional(),
  guestId: z.coerce.number().int().optional(),
  guest: z.any().optional(),
});

export const updateReservationZodSchema = z.object({
  dateArrivee: z.string().optional(),
  dateDepart: z.string().optional(),
  statut: z.string().optional(),
  roomId: z.coerce.number().optional(),
});

export const cancelReservationZodSchema = z.object({
  motif: z
    .string()
    .min(10, 'Le motif d’annulation doit contenir au moins 10 caractères.'),
});

export const noShowReservationZodSchema = z.object({
  motif: z
    .string()
    .min(
      10,
      'Le motif de non-présentation doit contenir au moins 10 caractères.',
    ),
});

export const checkAvailabilityZodSchema = z.object({
  du: z.string(),
  au: z.string(),
  roomTypeId: z.coerce.number().optional(),
});

export const checkRoomAvailabilityZodSchema = z.object({
  roomId: z.coerce.number(),
  du: z.string(),
  au: z.string(),
});
