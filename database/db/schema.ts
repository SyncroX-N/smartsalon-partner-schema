import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  foreignKey,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// Custom PostgreSQL range types
export const tstzrange = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tstzrange";
  },
});

export const daterange = customType<{ data: string; driverData: string }>({
  dataType() {
    return "daterange";
  },
});

export const userType = pgEnum("UserType", [
  "COMPANY_ADMIN",
  "COMPANY_EMPLOYEE",
  "CUSTOMER",
]);

export const companyType = pgEnum("CompanyType", ["BUSINESS", "INDIVIDUAL"]);

export const companySpecialisation = pgEnum("CompanySpecialisation", [
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
]);

export const companySize = pgEnum("CompanySize", ["2_5", "6_10", "+11"]);

export const timeSlotStrategy = pgEnum("TimeSlotStrategy", [
  "REGULAR",
  "REDUCE_GAPS",
  "ELIMINATE_GAPS",
]);
export const stripeCapabilityStatus = pgEnum("StripeCapabilityStatus", ['active', 'inactive', 'pending'])
export const stripeOnboardingStatus = pgEnum("StripeOnboardingStatus", ['NOT_CREATED', 'REQUIRES_ACTION', 'PENDING_VERIFICATION', 'ACTIVE', 'RESTRICTED'])

// types/scheduling.ts
export type HHMM = `${number}${number}:${number}${number}`;

export type DayInterval = { start: HHMM; end: HHMM };

export type RegularSchedule = {
  mon: DayInterval[];
  tue: DayInterval[];
  wed: DayInterval[];
  thu: DayInterval[];
  fri: DayInterval[];
  sat: DayInterval[];
  sun: DayInterval[];
};

// Handy constant default (all days closed)
export const EMPTY_SCHEDULE: RegularSchedule = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

export const company = pgTable("Company", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  type: companyType("type"),
  mainSpecialisation: companySpecialisation("mainSpecialisation"),
  secondarySpecialisations: companySpecialisation(
    "secondarySpecialisations"
  ).array(),
  stripeAccountId: text().unique(),
	stripeDetailsSubmitted: boolean().default(false),
	stripeOnboardingStatus: stripeOnboardingStatus(),
	stripeRequirementsDue: jsonb(),
	stripeCardPaymentsCapability: stripeCapabilityStatus(),
	stripeTransfersCapability: stripeCapabilityStatus(),
  payoutsEnabled: boolean().default(false),
  chargesEnabled: boolean().default(false),
  size: companySize("size"),
  businessName: text(),
  country: text(),
  timezone: text(),
  currency: text(),
  address: text(),
  phoneNumber: text(),
  email: text(),
  website: text(),
  description: text(),
  logoUrl: text(),
  bannerUrl: text(),
  legalName: text(),
  registrationNumber: text(),
  vatNumber: text(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const companyRelations = relations(company, ({ many }) => ({
  locations: many(location),
  users: many(user),
}));

export const location = pgTable("Location", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  name: text(),
  address: text(),
  phoneNumber: text(),
  email: text(),
  timezone: text().notNull().default("Europe/Rome"),
  // Time slot configuration
  slotDurationMinutes: integer("slotDurationMinutes").notNull().default(15),
  timeSlotStrategy: timeSlotStrategy("timeSlotStrategy")
    .notNull()
    .default("REGULAR"),
  // Booking window constraints
  customerBookingLeadMinutes: integer("customerBookingLeadMinutes")
    .notNull()
    .default(0),
  customerBookingMaxMonthsAhead: integer("customerBookingMaxMonthsAhead")
    .notNull()
    .default(6),
  // Cancellation / rescheduling windows
  customerCancelLeadMinutes: integer("customerCancelLeadMinutes")
    .notNull()
    .default(60),
  // Booking UX flags
  allowCustomerSelectTeamMember: boolean("allowCustomerSelectTeamMember")
    .notNull()
    .default(true),
  showTeamMemberRating: boolean("showTeamMemberRating").notNull().default(true),
  // Notifications
  notifyTeamOnCustomerActions: boolean("notifyTeamOnCustomerActions")
    .notNull()
    .default(true),
  notifyCustomerActionEmails: text("notifyCustomerActionEmails"), // comma-separated
  // Google Places address fields
  placeId: text(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  streetNumber: text(),
  route: text(),
  city: text(),
  state: text(),
  country: text(),
  countryCode: text(),
  postalCode: text(),
  placeTypes: text().array(),
  companyId: uuid()
    .notNull()
    .references(() => company.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Days or periods when a location is entirely closed (no bookings)
export const locationClosure = pgTable("LocationClosure", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("locationId")
    .notNull()
    .references(() => location.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  dateRange: daterange("dateRange").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const locationRelations = relations(location, ({ one, many }) => ({
  company: one(company, {
    fields: [location.companyId],
    references: [company.id],
  }),
  users: many(user),
  bookings: many(booking),
  services: many(locationService),
  serviceCategories: many(locationServiceCategory),
  customers: many(locationCustomer),
  closures: many(locationClosure),
}));

export const locationRole = pgEnum("LocationRole", [
  "ADMIN",
  "MANAGER",
  "STAFF",
  "VIEW_ONLY",
]);

export const userLocationAccess = pgTable(
  "UserLocationAccess",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    locationId: uuid("locationId")
      .notNull()
      .references(() => location.id, { onDelete: "cascade" }),
    role: locationRole("role").notNull().default("STAFF"),
    permissions: json("permissions").$type<{
      canManageBookings?: boolean;
      canManageCustomers?: boolean;
      canManageServices?: boolean;
      canViewReports?: boolean;
      canManageEmployees?: boolean;
      canManageSettings?: boolean;
      canManageSales?: boolean;
    }>(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("user_location_access_unique").on(t.userId, t.locationId)]
);

export const user = pgTable(
  "User",
  {
    id: uuid().notNull().primaryKey(),
    type: userType("type"),
    companyId: uuid().references(() => company.id, {
      onUpdate: "cascade",
      onDelete: "set null",
    }),
    locationId: uuid().references(() => location.id, {
      onUpdate: "cascade",
      onDelete: "set null",
    }),
    phoneCountryCode: text(),
    phoneNumber: text(),
    email: text(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    preferredLanguage: text(),
    notes: text(),
    imageUrl: text(),
    dateOfBirth: date("dateOfBirth"),
    color: text().default("#FF69B4").notNull(),
    operatingHours: jsonb("operatingHours")
      .$type<RegularSchedule>()
      .default(
        sql`'{"mon":["09:00:00","20:00:00"],"tue":["09:00:00","20:00:00"],"wed":["09:00:00","20:00:00"],"thu":["09:00:00","20:00:00"],"fri":["09:00:00","20:00:00"],"sat":["09:00:00","20:00:00"],"sun":["09:00:00","20:00:00"]}'::jsonb`
      ),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: "User_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

// New tables: staff schedule overrides and unavailabilities
export const staffUnavailabilityType = pgEnum("StaffUnavailabilityType", [
  "VACATION",
  "SICK_LEAVE",
  "APPOINTMENT",
  "CUSTOM",
]);

export const staffScheduleOverride = pgTable("StaffScheduleOverride", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: uuid("staffId")
    .notNull()
    .references(() => user.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  // Optional explicit location; if null, infer from staff.locationId at usage time
  locationId: uuid("locationId").references(() => location.id, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  dateRange: daterange("dateRange").notNull(),
  operatingHours: jsonb("operatingHours")
    .$type<RegularSchedule>()
    .notNull()
    .default(
      sql`'{"mon":[],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}'::jsonb`
    ),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const staffUnavailability = pgTable("StaffUnavailability", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: uuid("staffId")
    .notNull()
    .references(() => user.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  // Optional explicit location; if null, infer from staff.locationId at usage time
  locationId: uuid("locationId").references(() => location.id, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  type: staffUnavailabilityType("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dateRange: daterange("dateRange").notNull(),
  startTime: text("startTime"), // HH:mm
  endTime: text("endTime"), // HH:mm
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const staffScheduleOverrideRelations = relations(
  staffScheduleOverride,
  ({ one }) => ({
    staff: one(user, {
      fields: [staffScheduleOverride.staffId],
      references: [user.id],
    }),
    location: one(location, {
      fields: [staffScheduleOverride.locationId],
      references: [location.id],
    }),
  })
);

export const staffUnavailabilityRelations = relations(
  staffUnavailability,
  ({ one }) => ({
    staff: one(user, {
      fields: [staffUnavailability.staffId],
      references: [user.id],
    }),
    location: one(location, {
      fields: [staffUnavailability.locationId],
      references: [location.id],
    }),
  })
);

export const userRelations = relations(user, ({ one, many }) => ({
  company: one(company, {
    fields: [user.companyId],
    references: [company.id],
  }),
  location: one(location, {
    fields: [user.locationId],
    references: [location.id],
  }),
  bookings: many(booking, { relationName: "customerBookings" }),
  assignedBookings: many(bookingServiceAssignment, {
    relationName: "employeeAssignments",
  }),
  customerLocations: many(locationCustomer, {
    relationName: "customerLocations",
  }),
  serviceCapabilities: many(staffServiceCapability, {
    relationName: "serviceCapabilities",
  }),
  scheduleOverrides: many(staffScheduleOverride),
  unavailabilities: many(staffUnavailability),
}));

export const bookingStatus = pgEnum("BookingStatus", [
  "PENDING_CONFIRMATION",
  "AWAITING_PAYMENT",
  "CONFIRMED_PAID",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_COMPANY",
  "COMPLETED",
  "NO_SHOW",
]);

// General service categories (global, not location-specific)
export const serviceCategory = pgTable("ServiceCategory", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("displayOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const serviceCategoryRelations = relations(
  serviceCategory,
  ({ many }) => ({
    services: many(service),
  })
);

// General services (global, not location-specific)
export const service = pgTable("Service", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("categoryId")
    .notNull()
    .references(() => serviceCategory.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("displayOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const serviceRelations = relations(service, ({ one, many }) => ({
  category: one(serviceCategory, {
    fields: [service.categoryId],
    references: [serviceCategory.id],
  }),
  locationServices: many(locationService),
}));

export const locationServiceCategory = pgTable("LocationServiceCategory", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("locationId")
    .notNull()
    .references(() => location.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("displayOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const locationServiceCategoryRelations = relations(
  locationServiceCategory,
  ({ one, many }) => ({
    location: one(location, {
      fields: [locationServiceCategory.locationId],
      references: [location.id],
    }),
    services: many(locationService),
  })
);

export const locationService = pgTable("LocationService", {
  id: uuid("id").defaultRandom().primaryKey(),
  locationId: uuid("locationId")
    .notNull()
    .references(() => location.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  categoryId: uuid("categoryId").references(() => locationServiceCategory.id, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  serviceTypeId: uuid("serviceTypeId").references(() => service.id, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  durationMinutes: integer("durationMinutes").notNull(),
  priceAmount: integer("priceAmount").notNull(),
  priceCurrency: text("priceCurrency").notNull(),
  displayOrder: integer("displayOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const locationServiceRelations = relations(
  locationService,
  ({ one, many }) => ({
    location: one(location, {
      fields: [locationService.locationId],
      references: [location.id],
    }),
    category: one(locationServiceCategory, {
      fields: [locationService.categoryId],
      references: [locationServiceCategory.id],
    }),
    serviceType: one(service, {
      fields: [locationService.serviceTypeId],
      references: [service.id],
    }),
    bookingAssignments: many(bookingServiceAssignment),
    staffCapabilities: many(staffServiceCapability, {
      relationName: "staffCapabilities",
    }),
  })
);

export const booking = pgTable("Booking", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customerId").references(() => user.id, {
    onUpdate: "cascade",
    onDelete: "restrict",
  }),
  guestFirstName: text("guestFirstName"),
  guestLastName: text("guestLastName"),
  guestPhoneNumber: text("guestPhoneNumber"),
  locationId: uuid("locationId")
    .notNull()
    .references(() => location.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  startTime: timestamp("startTime", { withTimezone: true }).notNull(),
  endTime: timestamp("endTime", { withTimezone: true }).notNull(),
  // Derived fields for efficient local-day queries
  localStartDate: date("localStartDate").notNull(),
  localEndDate: date("localEndDate").notNull(),
  localStartMinutes: integer("localStartMinutes").notNull(),
  localEndMinutes: integer("localEndMinutes").notNull(),
  totalAmount: integer("totalAmount").notNull(),
  currency: text("currency").notNull(),
  status: bookingStatus("status").notNull().default("AWAITING_PAYMENT"),
  paymentIntentId: text("paymentIntentId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookingRelations = relations(booking, ({ one, many }) => ({
  customer: one(user, {
    fields: [booking.customerId],
    references: [user.id],
    relationName: "customerBookings",
  }),
  location: one(location, {
    fields: [booking.locationId],
    references: [location.id],
  }),
  serviceAssignments: many(bookingServiceAssignment),
}));

export const bookingServiceAssignment = pgTable("BookingServiceAssignment", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("bookingId")
    .notNull()
    .references(() => booking.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  serviceId: uuid("serviceId")
    .notNull()
    .references(() => locationService.id, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  employeeId: uuid("employeeId")
    .notNull()
    .references(() => user.id, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  localStartDate: date("localStartDate").notNull(),
  localStartMinutes: integer("localStartMinutes").notNull(),
  localEndMinutes: integer("localEndMinutes").notNull(),
  startTime: timestamp("startTime", {
    withTimezone: true,
  }).notNull(),
  endTime: timestamp("endTime", {
    withTimezone: true,
  }).notNull(),
  priceAtBookingAmount: integer("priceAtBookingAmount").notNull(),
  priceAtBookingCurrency: text("priceAtBookingCurrency").notNull(),
  durationAtBookingMinutes: integer("durationAtBookingMinutes").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookingServiceAssignmentRelations = relations(
  bookingServiceAssignment,
  ({ one }) => ({
    booking: one(booking, {
      fields: [bookingServiceAssignment.bookingId],
      references: [booking.id],
    }),
    service: one(locationService, {
      fields: [bookingServiceAssignment.serviceId],
      references: [locationService.id],
    }),
    employee: one(user, {
      fields: [bookingServiceAssignment.employeeId],
      references: [user.id],
      relationName: "employeeAssignments",
    }),
  })
);

export const locationCustomer = pgTable(
  "LocationCustomer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("locationId")
      .notNull()
      .references(() => location.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    customerId: uuid("customerId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    notes: text("notes"), // Internal notes about the customer
    tags: text("tags").array(), // Tags for customer categorization (VIP, regular, etc.)
    isActive: boolean("isActive").default(true), // For soft deletion/deactivation
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Ensure a customer can only be added once per location
    uniqueIndex("location_customer_unique").on(
      table.locationId,
      table.customerId
    ),
  ]
);

export const locationCustomerRelations = relations(
  locationCustomer,
  ({ one }) => ({
    location: one(location, {
      fields: [locationCustomer.locationId],
      references: [location.id],
    }),
    customer: one(user, {
      fields: [locationCustomer.customerId],
      references: [user.id],
      relationName: "customerLocations",
    }),
  })
);

export const staffServiceCapability = pgTable(
  "StaffServiceCapability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staffId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    serviceId: uuid("serviceId")
      .notNull()
      .references(() => locationService.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Ensure a staff member can only have one capability record per service
    uniqueIndex("staff_service_capability_unique").on(
      table.staffId,
      table.serviceId
    ),
  ]
);

export const staffServiceCapabilityRelations = relations(
  staffServiceCapability,
  ({ one }) => ({
    staff: one(user, {
      fields: [staffServiceCapability.staffId],
      references: [user.id],
      relationName: "serviceCapabilities",
    }),
    service: one(locationService, {
      fields: [staffServiceCapability.serviceId],
      references: [locationService.id],
      relationName: "staffCapabilities",
    }),
  })
);

export const locationClosureRelations = relations(
  locationClosure,
  ({ one }) => ({
    location: one(location, {
      fields: [locationClosure.locationId],
      references: [location.id],
    }),
  })
);
