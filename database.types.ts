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
          createdAt: string;
          currency: string;
          customerId: string | null;
          endTime: string;
          guestFirstName: string | null;
          guestLastName: string | null;
          guestPhoneNumber: string | null;
          id: string;
          locationId: string;
          notes: string | null;
          paymentIntentId: string | null;
          startTime: string;
          status: Database["public"]["Enums"]["BookingStatus"];
          totalAmount: number;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          currency: string;
          customerId?: string | null;
          endTime: string;
          guestFirstName?: string | null;
          guestLastName?: string | null;
          guestPhoneNumber?: string | null;
          id?: string;
          locationId: string;
          notes?: string | null;
          paymentIntentId?: string | null;
          startTime: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          totalAmount: number;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          currency?: string;
          customerId?: string | null;
          endTime?: string;
          guestFirstName?: string | null;
          guestLastName?: string | null;
          guestPhoneNumber?: string | null;
          id?: string;
          locationId?: string;
          notes?: string | null;
          paymentIntentId?: string | null;
          startTime?: string;
          status?: Database["public"]["Enums"]["BookingStatus"];
          totalAmount?: number;
          updatedAt?: string;
        };
        Relationships: [
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
            foreignKeyName: "BookingServiceAssignment_serviceId_LocationService_id_fk";
            columns: ["serviceId"];
            isOneToOne: false;
            referencedRelation: "LocationService";
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
      LocationCustomer: {
        Row: {
          createdAt: string;
          customerId: string;
          id: string;
          isActive: boolean | null;
          locationId: string;
          notes: string | null;
          tags: string[] | null;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          customerId: string;
          id?: string;
          isActive?: boolean | null;
          locationId: string;
          notes?: string | null;
          tags?: string[] | null;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          customerId?: string;
          id?: string;
          isActive?: boolean | null;
          locationId?: string;
          notes?: string | null;
          tags?: string[] | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "LocationCustomer_customerId_User_id_fk";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "User";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "LocationCustomer_locationId_Location_id_fk";
            columns: ["locationId"];
            isOneToOne: false;
            referencedRelation: "Location";
            referencedColumns: ["id"];
          },
        ];
      };
      LocationService: {
        Row: {
          categoryId: string | null;
          createdAt: string;
          description: string | null;
          displayOrder: number | null;
          durationMinutes: number;
          id: string;
          isActive: boolean | null;
          locationId: string;
          name: string;
          priceAmount: number;
          priceCurrency: string;
          serviceTypeId: string | null;
          updatedAt: string;
        };
        Insert: {
          categoryId?: string | null;
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          durationMinutes: number;
          id?: string;
          isActive?: boolean | null;
          locationId: string;
          name: string;
          priceAmount: number;
          priceCurrency: string;
          serviceTypeId?: string | null;
          updatedAt?: string;
        };
        Update: {
          categoryId?: string | null;
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          durationMinutes?: number;
          id?: string;
          isActive?: boolean | null;
          locationId?: string;
          name?: string;
          priceAmount?: number;
          priceCurrency?: string;
          serviceTypeId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "LocationService_categoryId_LocationServiceCategory_id_fk";
            columns: ["categoryId"];
            isOneToOne: false;
            referencedRelation: "LocationServiceCategory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "LocationService_locationId_Location_id_fk";
            columns: ["locationId"];
            isOneToOne: false;
            referencedRelation: "Location";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "LocationService_serviceTypeId_Service_id_fk";
            columns: ["serviceTypeId"];
            isOneToOne: false;
            referencedRelation: "Service";
            referencedColumns: ["id"];
          },
        ];
      };
      LocationServiceCategory: {
        Row: {
          createdAt: string;
          description: string | null;
          displayOrder: number | null;
          id: string;
          isActive: boolean | null;
          locationId: string;
          name: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          locationId: string;
          name: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          locationId?: string;
          name?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "LocationServiceCategory_locationId_Location_id_fk";
            columns: ["locationId"];
            isOneToOne: false;
            referencedRelation: "Location";
            referencedColumns: ["id"];
          },
        ];
      };
      Service: {
        Row: {
          categoryId: string;
          createdAt: string;
          description: string | null;
          displayOrder: number | null;
          id: string;
          isActive: boolean | null;
          name: string;
          updatedAt: string;
        };
        Insert: {
          categoryId: string;
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          name: string;
          updatedAt?: string;
        };
        Update: {
          categoryId?: string;
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          name?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Service_categoryId_ServiceCategory_id_fk";
            columns: ["categoryId"];
            isOneToOne: false;
            referencedRelation: "ServiceCategory";
            referencedColumns: ["id"];
          },
        ];
      };
      ServiceCategory: {
        Row: {
          createdAt: string;
          description: string | null;
          displayOrder: number | null;
          id: string;
          isActive: boolean | null;
          name: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          name: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          description?: string | null;
          displayOrder?: number | null;
          id?: string;
          isActive?: boolean | null;
          name?: string;
          updatedAt?: string;
        };
        Relationships: [];
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
      cleanup_failed_registration: {
        Args: { user_id: string };
        Returns: undefined;
      };
      complete_company_onboarding_transaction: {
        Args: {
          p_account_type: string;
          p_business_name: string;
          p_company_id: string;
          p_main_specialisation: string;
          p_secondary_specialisations: string[];
          p_service_locations: string[];
          p_user_id: string;
          p_team_size?: string;
          p_website?: string;
          p_address?: string;
          p_place_id?: string;
          p_latitude?: number;
          p_longitude?: number;
          p_street_number?: string;
          p_route?: string;
          p_city?: string;
          p_state?: string;
          p_country?: string;
          p_country_code?: string;
          p_postal_code?: string;
          p_place_types?: string[];
        };
        Returns: Json;
      };
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
      register_user_transaction: {
        Args: {
          user_id: string;
          user_type: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          email: string;
          preferred_language: string;
          country: string;
          currency: string;
          timezone: string;
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
