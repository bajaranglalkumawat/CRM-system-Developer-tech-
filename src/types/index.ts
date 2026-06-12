import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  totalRevenue: number;
  pendingPayments: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "client" | "project" | "invoice";
  action: string;
  name: string;
  date: string;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  projectType: string;
  notes: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  status: "PENDING" | "WORKING" | "DELIVERED" | "COMPLETED";
  dueDate: string;
  progress: number;
  clientId: string;
}

export interface InvoiceFormData {
  serviceName: string;
  amount: number;
  date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  clientId: string;
}

export interface MonitorFormData {
  url: string;
}
