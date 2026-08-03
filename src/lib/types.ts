/** Roles y estados tipados (SQL Server no soporta enums de Prisma). */
export const Role = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EnrollmentStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type EnrollmentStatus =
  (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
