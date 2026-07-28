import { z } from 'zod';

export const createReservationZodSchema = z.object({
  roomId: z.coerce.number().optional(),
  roomTypeId: z.coerce.number(),
  guestId: z.coerce.number(),
  dateArrivee: z.string(),
  dateDepart: z.string(),
  formuleHebergement: z.string(),
});

export const updateReservationZodSchema = z.object({
  dateArrivee: z.string().optional(),
  dateDepart: z.string().optional(),
  statut: z.string().optional(),
  roomId: z.coerce.number().optional(),
});

export const cancelReservationZodSchema = z.object({
  motif: z.string().min(10, 'Le motif d’annulation doit contenir au moins 10 caractères.'),
});

export const noShowReservationZodSchema = z.object({
  motif: z.string().min(10, 'Le motif de non-présentation doit contenir au moins 10 caractères.'),
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
