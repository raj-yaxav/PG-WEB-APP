export type DashboardRole = "owner" | "manager" | "tenant";

export interface DashboardUser {
  _id?: string;
  id?: string;
  name?: string;
  role?: DashboardRole;
  loginId?: string;
  email?: string;
  profilePhotoUrl?: string;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  badge?: {
    text: string;
    color: string;
  };
  subLabel?: string;
  valueColor?: string;
}

export interface OccupancyRoomType {
  name: string;
  occupied: number;
  total: number;
  percentage: number;
}

export interface DueRecord {
  id: string;
  tenant: {
    name: string;
    phone: string;
    initials: string;
    avatarColor: string;
  };
  unit: string;
  bed: string;
  amount: string;
}

export interface RentSummary {
  collected: string;
  collectedPercent: number;
  target: string;
  dues: string;
  actionLabel: string;
}

export interface DashboardData {
  role: DashboardRole;
  title: string;
  subtitle: string;
  propertyScope: string;
  profileLabel: string;
  canAddProperty: boolean;
  searchPlaceholder: string;
  stats: StatCardData[];
  roomTypes: OccupancyRoomType[];
  rent: RentSummary;
  dues: DueRecord[];
  complaintsOpen: number;
  complaintsMessage: string;
}

export interface DashboardSummary {
  tenant?: {
    propertyName?: string;
    roomNumber?: string;
    roomType?: string;
    bedNumber?: string;
    bedStatus?: string;
    rentAmount?: number;
  };
  properties?: {
    totalProperties?: number;
  };
  rooms?: {
    totalRooms?: number;
  };
  beds?: {
    totalBeds?: number;
    occupiedBeds?: number;
    vacantBeds?: number;
    bookedBeds?: number;
    maintenanceBeds?: number;
  };
  tenants?: {
    activeTenants?: number;
  };
  rent?: {
    monthlyExpectedRent?: number;
    monthlyCollectedRent?: number;
    pendingDues?: number;
    latestStatus?: string;
    dueDate?: string | null;
    paymentLink?: string | null;
  };
  complaints?: {
    openComplaints?: number;
  };
}

const emptyRoomTypes: OccupancyRoomType[] = [
  { name: "OCCUPIED", occupied: 0, total: 0, percentage: 0 },
  { name: "VACANT", occupied: 0, total: 0, percentage: 0 },
  { name: "BOOKED", occupied: 0, total: 0, percentage: 0 },
  { name: "MAINTENANCE", occupied: 0, total: 0, percentage: 0 },
];

const emptyRent: RentSummary = {
  collected: "Rs 0",
  collectedPercent: 0,
  target: "Rs 0",
  dues: "Rs 0",
  actionLabel: "Review Reports",
};

export function getDashboardData(user: DashboardUser | null): DashboardData {
  const role = user?.role || "owner";

  if (role === "tenant") {
    return {
      role,
      title: "My Stay Dashboard",
      subtitle: "Room, rent, payment, and complaint status for your account.",
      propertyScope: "MY ROOM",
      profileLabel: "Tenant",
      canAddProperty: false,
      searchPlaceholder: "Search payments or complaints...",
      stats: [
        { id: "room", label: "MY ROOM", value: "Not assigned", icon: "door", subLabel: "PENDING" },
        { id: "bed", label: "BED", value: "Not assigned", icon: "bed", subLabel: "PENDING" },
        { id: "rent", label: "MONTHLY RENT", value: "Rs 0", icon: "wallet" },
        { id: "paid", label: "PAID", value: "Rs 0", icon: "check", valueColor: "text-green-500" },
        { id: "due", label: "DUE", value: "Rs 0", icon: "calendar", valueColor: "text-green-500" },
        { id: "issues", label: "COMPLAINTS", value: 0, icon: "wrench", subLabel: "CLEAR" },
      ],
      roomTypes: [{ name: "MY ROOM", occupied: 0, total: 1, percentage: 0 }],
      rent: { ...emptyRent, actionLabel: "Pay Rent" },
      dues: [],
      complaintsOpen: 0,
      complaintsMessage: "No active complaint for your stay.",
    };
  }

  if (role === "manager") {
    return {
      role,
      title: "Manager Dashboard",
      subtitle: "Today’s occupancy, rent follow-ups, room allotments, and complaints.",
      propertyScope: "ASSIGNED PROPERTY",
      profileLabel: "Manager",
      canAddProperty: false,
      searchPlaceholder: "Search tenant or room...",
      stats: [
        { id: "rooms", label: "TOTAL ROOMS", value: 0, icon: "door" },
        { id: "beds", label: "TOTAL BEDS", value: 0, icon: "bed", subLabel: "CAP" },
        { id: "occupied", label: "OCCUPIED", value: 0, icon: "check", badge: { text: "0% FULL", color: "bg-blue-100 text-blue-600" }, valueColor: "text-blue-500" },
        { id: "vacant", label: "VACANT", value: 0, icon: "door-open" },
        { id: "booked", label: "BOOKED", value: 0, icon: "calendar", subLabel: "INCOMING" },
        { id: "issues", label: "SERVICE", value: 0, icon: "wrench", subLabel: "ISSUES", valueColor: "text-green-500" },
      ],
      roomTypes: emptyRoomTypes,
      rent: { ...emptyRent, actionLabel: "View Reports" },
      dues: [],
      complaintsOpen: 0,
      complaintsMessage: "No active issues reported. Your assigned property data will appear here.",
    };
  }

  return {
    role,
    title: "Owner Dashboard",
    subtitle: "Properties, manager reports, tenant count, and live branch health.",
    propertyScope: "ALL PROPERTIES",
    profileLabel: "Owner",
    canAddProperty: true,
    searchPlaceholder: "Search tenant or room...",
    stats: [
      { id: "properties", label: "PROPERTIES", value: 0, icon: "building", subLabel: "ACTIVE" },
      { id: "rooms", label: "TOTAL ROOMS", value: 0, icon: "door" },
      { id: "beds", label: "TOTAL BEDS", value: 0, icon: "bed", subLabel: "CAP" },
      { id: "occupied", label: "OCCUPIED", value: 0, icon: "check", badge: { text: "0% FULL", color: "bg-blue-100 text-blue-600" }, valueColor: "text-blue-500" },
      { id: "vacant", label: "VACANT", value: 0, icon: "door-open" },
      { id: "tenants", label: "TENANTS", value: 0, icon: "users", subLabel: "ACTIVE" },
      { id: "issues", label: "ISSUES", value: 0, icon: "wrench", subLabel: "OPEN", valueColor: "text-green-500" },
    ],
    roomTypes: emptyRoomTypes,
    rent: emptyRent,
    dues: [],
    complaintsOpen: 0,
    complaintsMessage: "No active issues reported. Your facility is running perfectly at the moment.",
  };
}

const formatMoney = (amount = 0) => `Rs ${amount.toLocaleString("en-IN")}`;

const percentOf = (value = 0, total = 0) => {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

export function applyDashboardSummary(base: DashboardData, summary: DashboardSummary): DashboardData {
  if (base.role === "tenant" && summary.tenant) {
    const expectedRent = summary.rent?.monthlyExpectedRent ?? summary.tenant.rentAmount ?? 0;
    const collectedRent = summary.rent?.monthlyCollectedRent ?? 0;
    const pendingDuesAmount = summary.rent?.pendingDues ?? Math.max(0, expectedRent - collectedRent);
    const openComplaints = summary.complaints?.openComplaints ?? 0;
    const roomNumber = summary.tenant.roomNumber || "Not assigned";
    const bedNumber = summary.tenant.bedNumber || "Not assigned";

    return {
      ...base,
      propertyScope: summary.tenant.propertyName || "MY ROOM",
      stats: [
        { id: "room", label: "MY ROOM", value: roomNumber, icon: "door", subLabel: "ACTIVE" },
        { id: "bed", label: "BED", value: bedNumber, icon: "bed", subLabel: summary.tenant.bedStatus || "ASSIGNED" },
        { id: "rent", label: "MONTHLY RENT", value: formatMoney(expectedRent), icon: "wallet" },
        { id: "paid", label: "PAID", value: formatMoney(collectedRent), icon: "check", valueColor: "text-green-500" },
        { id: "due", label: "DUE", value: formatMoney(pendingDuesAmount), icon: "calendar", valueColor: pendingDuesAmount > 0 ? "text-orange-500" : "text-green-500" },
        { id: "issues", label: "COMPLAINTS", value: openComplaints, icon: "wrench", subLabel: openComplaints > 0 ? "OPEN" : "CLEAR" },
      ],
      roomTypes: [{ name: "MY ROOM", occupied: summary.tenant.bedNumber ? 1 : 0, total: 1, percentage: summary.tenant.bedNumber ? 100 : 0 }],
      rent: {
        collected: formatMoney(collectedRent),
        collectedPercent: percentOf(collectedRent, expectedRent),
        target: formatMoney(expectedRent),
        dues: formatMoney(pendingDuesAmount),
        actionLabel: "Pay Rent",
      },
      dues:
        pendingDuesAmount > 0
          ? [createDuesSummary(roomNumber, bedNumber, formatMoney(pendingDuesAmount))]
          : [],
      complaintsOpen: openComplaints,
      complaintsMessage:
        openComplaints > 0
          ? `${openComplaints} complaint${openComplaints === 1 ? "" : "s"} currently open.`
          : "No active complaint for your stay.",
    };
  }

  const totalRooms = summary.rooms?.totalRooms ?? 0;
  const totalProperties = summary.properties?.totalProperties ?? 0;
  const totalBeds = summary.beds?.totalBeds ?? 0;
  const occupiedBeds = summary.beds?.occupiedBeds ?? 0;
  const vacantBeds = summary.beds?.vacantBeds ?? 0;
  const bookedBeds = summary.beds?.bookedBeds ?? 0;
  const maintenanceBeds = summary.beds?.maintenanceBeds ?? 0;
  const activeTenants = summary.tenants?.activeTenants ?? 0;
  const expectedRent = summary.rent?.monthlyExpectedRent ?? 0;
  const collectedRent = summary.rent?.monthlyCollectedRent ?? 0;
  const pendingDuesAmount = summary.rent?.pendingDues ?? 0;
  const openComplaints = summary.complaints?.openComplaints ?? 0;
  const occupiedPercent = percentOf(occupiedBeds, totalBeds);
  const issueCount = maintenanceBeds + openComplaints;

  return {
    ...base,
    stats: [
      ...(base.role === "owner"
        ? [{ id: "properties", label: "PROPERTIES", value: totalProperties, icon: "building", subLabel: "ACTIVE" }]
        : []),
      { id: "rooms", label: "TOTAL ROOMS", value: totalRooms, icon: "door" },
      { id: "beds", label: "TOTAL BEDS", value: totalBeds, icon: "bed", subLabel: "CAP" },
      {
        id: "occupied",
        label: "OCCUPIED",
        value: occupiedBeds,
        icon: "check",
        badge: { text: `${occupiedPercent}% FULL`, color: "bg-green-100 text-green-600" },
        valueColor: "text-green-500",
      },
      { id: "vacant", label: "VACANT", value: vacantBeds, icon: "door-open" },
      { id: "tenants", label: "TENANTS", value: activeTenants, icon: "users", subLabel: "ACTIVE" },
      {
        id: "issues",
        label: "ISSUES",
        value: issueCount,
        icon: "wrench",
        subLabel: "OPEN",
        valueColor: issueCount > 0 ? "text-orange-500" : "text-green-500",
      },
    ],
    roomTypes: [
      { name: "OCCUPIED", occupied: occupiedBeds, total: totalBeds, percentage: occupiedPercent },
      { name: "VACANT", occupied: vacantBeds, total: totalBeds, percentage: percentOf(vacantBeds, totalBeds) },
      { name: "BOOKED", occupied: bookedBeds, total: totalBeds, percentage: percentOf(bookedBeds, totalBeds) },
      { name: "MAINTENANCE", occupied: maintenanceBeds, total: totalBeds, percentage: percentOf(maintenanceBeds, totalBeds) },
    ],
    rent: {
      collected: formatMoney(collectedRent),
      collectedPercent: percentOf(collectedRent, expectedRent),
      target: formatMoney(expectedRent),
      dues: formatMoney(pendingDuesAmount),
      actionLabel: base.role === "manager" ? "View Reports" : "Review Reports",
    },
    dues:
      pendingDuesAmount > 0
        ? [
            createDuesSummary(base.propertyScope, "Pending", formatMoney(pendingDuesAmount)),
          ]
        : [],
    complaintsOpen: openComplaints,
    complaintsMessage:
      openComplaints > 0
        ? `${openComplaints} open complaint${openComplaints === 1 ? "" : "s"} need follow-up.`
        : "No active issues reported. Your facility is running smoothly at the moment.",
  };
}

function createDuesSummary(unit: string, bed: string, amount: string): DueRecord {
  return {
    id: "dues-summary",
    tenant: {
      name: "Outstanding dues",
      phone: "All active invoices",
      initials: "OD",
      avatarColor: "bg-red-50 text-red-600",
    },
    unit,
    bed,
    amount,
  };
}
