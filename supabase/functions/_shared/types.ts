/**
 * Shared TypeScript types for Supabase Edge Functions
 * These are mainly for convenience - security is handled by RLS
 */

// Re-export the Database type from the generated types
// Import it where needed: import type { Database } from "../../../database.types";

// Company Update Data Types (for the onboarding data you provided)
export interface CompanyOnboardingData {
  accountType: "BUSINESS" | "INDIVIDUAL";
  businessName: string;
  services: string[];
  teamSize: "2_5" | "6_10" | "+11";
  website?: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface FunctionError {
  message: string;
  code?: string;
  details?: any;
}

// Auth Types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyId?: string;
    hasProfile?: boolean;
  };
}


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      Booking: {
        Row: {
          companyId: string;
          createdAt: string;
          currency: string;
          customerId: string | null;
          endTime: string;
          guestFirstName: string | null;
          guestLastName: string | null;
          guestPhoneNumber: string | null;
          id: string;
          locationId: string | null;
          notes: string | null;
          paymentIntentId: string | null;
          startTime: string;
          status: Database["public"]["Enums"]["BookingStatus"];
          totalAmount: number;
          updatedAt: string;
        };
        Insert: {
          companyId: string;
          createdAt?: string;
          currency: string;
          customerId?: string | null;
          endTime: string;
          guestFirstName?: string | null;
          guestLastName?: string | null;
          guestPhoneNumber?: string | null;
          id?: string;
          locationId?: string | null;
          notes?: string | null;
          paymentIntentId?: string | null;
          startTime: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          totalAmount: number;
          updatedAt?: string;
        };
        Update: {
          companyId?: string;
          createdAt?: string;
          currency?: string;
          customerId?: string | null;
          endTime?: string;
          guestFirstName?: string | null;
          guestLastName?: string | null;
          guestPhoneNumber?: string | null;
          id?: string;
          locationId?: string | null;
          notes?: string | null;
          paymentIntentId?: string | null;
          startTime?: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          totalAmount?: number;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Booking_companyId_Company_id_fk";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "Company";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Booking_customerId_User_id_fk";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Booking_locationId_Location_id_fk";
            columns: ["locationId"];
            isOneToOne: false;
            referencedRelation: "Location";
            referencedColumns: ["id"];
          },
        ];
      };
      BookingServiceAssignment: {
        Row: {
          bookingId: string;
          createdAt: string;
          durationAtBookingMinutes: number;
          employeeId: string;
          endTime: string;
          id: string;
          priceAtBookingAmount: number;
          priceAtBookingCurrency: string;
          serviceId: string;
          startTime: string;
          updatedAt: string;
        };
        Insert: {
          bookingId: string;
          createdAt?: string;
          durationAtBookingMinutes: number;
          employeeId: string;
          endTime: string;
          id?: string;
          priceAtBookingAmount: number;
          priceAtBookingCurrency: string;
          serviceId: string;
          startTime: string;
          updatedAt?: string;
        };
        Update: {
          bookingId?: string;
          createdAt?: string;
          durationAtBookingMinutes?: number;
          employeeId?: string;
          endTime?: string;
          id?: string;
          priceAtBookingAmount?: number;
          priceAtBookingCurrency?: string;
          serviceId?: string;
          startTime?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "BookingServiceAssignment_bookingId_Booking_id_fk";
            columns: ["bookingId"];
            isOneToOne: false;
            referencedRelation: "Booking";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "BookingServiceAssignment_employeeId_User_id_fk";
            columns: ["employeeId"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "BookingServiceAssignment_serviceId_Service_id_fk";
            columns: ["serviceId"];
            isOneToOne: false;
            referencedRelation: "Service";
            referencedColumns: ["id"];
          },
        ];
      };
      Company: {
        Row: {
          address: string | null;
          bannerUrl: string | null;
          businessName: string | null;
          country: string | null;
          createdAt: string;
          currency: string | null;
          description: string | null;
          email: string | null;
          id: string;
          legalName: string | null;
          logoUrl: string | null;
          mainSpecialisation:
            | Database["public"]["Enums"]["CompanySpecialisation"]
            | null;
          phoneNumber: string | null;
          registrationNumber: string | null;
          secondarySpecialisations:
            | Database["public"]["Enums"]["CompanySpecialisation"][]
            | null;
          servicesLocation:
            | Database["public"]["Enums"]["CompanyServicesLocation"]
            | null;
          size: Database["public"]["Enums"]["CompanySize"] | null;
          timezone: string | null;
          type: Database["public"]["Enums"]["CompanyType"] | null;
          updatedAt: string;
          vatNumber: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          bannerUrl?: string | null;
          businessName?: string | null;
          country?: string | null;
          createdAt?: string;
          currency?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          legalName?: string | null;
          logoUrl?: string | null;
          mainSpecialisation?:
            | Database["public"]["Enums"]["CompanySpecialisation"]
            | null;
          phoneNumber?: string | null;
          registrationNumber?: string | null;
          secondarySpecialisations?:
            | Database["public"]["Enums"]["CompanySpecialisation"][]
            | null;
          servicesLocation?:
            | Database["public"]["Enums"]["CompanyServicesLocation"]
            | null;
          size?: Database["public"]["Enums"]["CompanySize"] | null;
          timezone?: string | null;
          type?: Database["public"]["Enums"]["CompanyType"] | null;
          updatedAt?: string;
          vatNumber?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          bannerUrl?: string | null;
          businessName?: string | null;
          country?: string | null;
          createdAt?: string;
          currency?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          legalName?: string | null;
          logoUrl?: string | null;
          mainSpecialisation?:
            | Database["public"]["Enums"]["CompanySpecialisation"]
            | null;
          phoneNumber?: string | null;
          registrationNumber?: string | null;
          secondarySpecialisations?:
            | Database["public"]["Enums"]["CompanySpecialisation"][]
            | null;
          servicesLocation?:
            | Database["public"]["Enums"]["CompanyServicesLocation"]
            | null;
          size?: Database["public"]["Enums"]["CompanySize"] | null;
          timezone?: string | null;
          type?: Database["public"]["Enums"]["CompanyType"] | null;
          updatedAt?: string;
          vatNumber?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      Location: {
        Row: {
          address: string | null;
          companyId: string;
          createdAt: string;
          email: string | null;
          id: string;
          name: string | null;
          payoutsEnabled: boolean | null;
          phoneNumber: string | null;
          stripeAccountId: string | null;
          stripeDashboardUrl: string | null;
          updatedAt: string;
        };
        Insert: {
          address?: string | null;
          companyId: string;
          createdAt?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          payoutsEnabled?: boolean | null;
          phoneNumber?: string | null;
          stripeAccountId?: string | null;
          stripeDashboardUrl?: string | null;
          updatedAt?: string;
        };
        Update: {
          address?: string | null;
          companyId?: string;
          createdAt?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          payoutsEnabled?: boolean | null;
          phoneNumber?: string | null;
          stripeAccountId?: string | null;
          stripeDashboardUrl?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Location_companyId_Company_id_fk";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "Company";
            referencedColumns: ["id"];
          },
        ];
      };
      Service: {
        Row: {
          companyId: string;
          createdAt: string;
          description: string | null;
          durationMinutes: number;
          id: string;
          isActive: boolean | null;
          name: string;
          priceAmount: number;
          priceCurrency: string;
          updatedAt: string;
        };
        Insert: {
          companyId: string;
          createdAt?: string;
          description?: string | null;
          durationMinutes: number;
          id?: string;
          isActive?: boolean | null;
          name: string;
          priceAmount: number;
          priceCurrency: string;
          updatedAt?: string;
        };
        Update: {
          companyId?: string;
          createdAt?: string;
          description?: string | null;
          durationMinutes?: number;
          id?: string;
          isActive?: boolean | null;
          name?: string;
          priceAmount?: number;
          priceCurrency?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Service_companyId_Company_id_fk";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "Company";
            referencedColumns: ["id"];
          },
        ];
      };
      User: {
        Row: {
          companyId: string | null;
          email: string | null;
          firstName: string | null;
          id: string;
          lastName: string | null;
          locationId: string | null;
          phoneNumber: string | null;
          preferredLanguage: string | null;
          type: Database["public"]["Enums"]["UserType"] | null;
        };
        Insert: {
          companyId?: string | null;
          email?: string | null;
          firstName?: string | null;
          id: string;
          lastName?: string | null;
          locationId?: string | null;
          phoneNumber?: string | null;
          preferredLanguage?: string | null;
          type?: Database["public"]["Enums"]["UserType"] | null;
        };
        Update: {
          companyId?: string | null;
          email?: string | null;
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
          locationId?: string | null;
          phoneNumber?: string | null;
          preferredLanguage?: string | null;
          type?: Database["public"]["Enums"]["UserType"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "User_companyId_Company_id_fk";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "Company";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "User_locationId_Location_id_fk";
            columns: ["locationId"];
            isOneToOne: false;
            referencedRelation: "Location";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      register_user: {
        Args: {
          p_user_id: string;
          p_first_name: string;
          p_last_name: string;
          p_phone_number: string;
          p_email: string;
          p_preferred_language: string;
          p_country: string;
          p_currency: string;
          p_timezone: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      BookingStatus:
        | "PENDING_CONFIRMATION"
        | "AWAITING_PAYMENT"
        | "CONFIRMED_PAID"
        | "CANCELLED_BY_CUSTOMER"
        | "CANCELLED_BY_COMPANY"
        | "COMPLETED"
        | "NO_SHOW";
      CompanyServicesLocation:
        | "PHYSICAL_LOCATION"
        | "AT_CLIENT_LOCATION"
        | "DIGITAL";
      CompanySize: "2_5" | "6_10" | "+11";
      CompanySpecialisation:
        | "HAIR_SALON"
        | "NAILS"
        | "EYEBROWS_AND_LASHES"
        | "BEAUTY_SALON"
        | "MEDICAL_SPA"
        | "BARBER"
        | "MASSAGE"
        | "SPA_AND_SAUNA"
        | "WAXING_SALON"
        | "TATTOO_AND_PIERCING"
        | "TANNING_STUDIO"
        | "FITNESS_AND_WELLNESS"
        | "PHYSICAL_THERAPY"
        | "HEALTH_PRACTICE"
        | "PET_GROOMING"
        | "OTHER";
      CompanyType: "BUSINESS" | "INDIVIDUAL";
      UserType: "COMPANY_ADMIN" | "COMPANY_EMPLOYEE" | "CUSTOMER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      BookingStatus: [
        "PENDING_CONFIRMATION",
        "AWAITING_PAYMENT",
        "CONFIRMED_PAID",
        "CANCELLED_BY_CUSTOMER",
        "CANCELLED_BY_COMPANY",
        "COMPLETED",
        "NO_SHOW",
      ],
      CompanyServicesLocation: [
        "PHYSICAL_LOCATION",
        "AT_CLIENT_LOCATION",
        "DIGITAL",
      ],
      CompanySize: ["2_5", "6_10", "+11"],
      CompanySpecialisation: [
        "HAIR_SALON",
        "NAILS",
        "EYEBROWS_AND_LASHES",
        "BEAUTY_SALON",
        "MEDICAL_SPA",
        "BARBER",
        "MASSAGE",
        "SPA_AND_SAUNA",
        "WAXING_SALON",
        "TATTOO_AND_PIERCING",
        "TANNING_STUDIO",
        "FITNESS_AND_WELLNESS",
        "PHYSICAL_THERAPY",
        "HEALTH_PRACTICE",
        "PET_GROOMING",
        "OTHER",
      ],
      CompanyType: ["BUSINESS", "INDIVIDUAL"],
      UserType: ["COMPANY_ADMIN", "COMPANY_EMPLOYEE", "CUSTOMER"],
    },
  },
} as const;

export enum BookingStatus {
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
    AWAITING_PAYMENT = "AWAITING_PAYMENT",
    CONFIRMED_PAID = "CONFIRMED_PAID",
    CANCELLED_BY_CUSTOMER = "CANCELLED_BY_CUSTOMER",
    CANCELLED_BY_COMPANY = "CANCELLED_BY_COMPANY",
    COMPLETED = "COMPLETED",
    NO_SHOW = "NO_SHOW"
  }
  
  export enum CompanyServicesLocation {
    PHYSICAL_LOCATION = "PHYSICAL_LOCATION",
    AT_CLIENT_LOCATION = "AT_CLIENT_LOCATION",
    DIGITAL = "DIGITAL"
  }
  
  export enum CompanySize {
    2_5 = "2_5",
    6_10 = "6_10",
    +11 = "+11"
  }
  
  export enum CompanySpecialisation {
    HAIR_SALON = "HAIR_SALON",
    NAILS = "NAILS",
    EYEBROWS_AND_LASHES = "EYEBROWS_AND_LASHES",
    BEAUTY_SALON = "BEAUTY_SALON",
    MEDICAL_SPA = "MEDICAL_SPA",
    BARBER = "BARBER",
    MASSAGE = "MASSAGE",
    SPA_AND_SAUNA = "SPA_AND_SAUNA",
    WAXING_SALON = "WAXING_SALON",
    TATTOO_AND_PIERCING = "TATTOO_AND_PIERCING",
    TANNING_STUDIO = "TANNING_STUDIO",
    FITNESS_AND_WELLNESS = "FITNESS_AND_WELLNESS",
    PHYSICAL_THERAPY = "PHYSICAL_THERAPY",
    HEALTH_PRACTICE = "HEALTH_PRACTICE",
    PET_GROOMING = "PET_GROOMING",
    OTHER = "OTHER"
  }
  
  export enum CompanyType {
    BUSINESS = "BUSINESS",
    INDIVIDUAL = "INDIVIDUAL"
  }
  
  export enum UserType {
    COMPANY_ADMIN = "COMPANY_ADMIN",
    COMPANY_EMPLOYEE = "COMPANY_EMPLOYEE",
    CUSTOMER = "CUSTOMER"
  }