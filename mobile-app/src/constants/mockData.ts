import type { User } from '../types/auth.types';

const randomFrom = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const randomAmount = (min: number, max: number) =>
  `Rs ${Math.floor(Math.random() * (max - min + 1) + min).toLocaleString('en-IN')}`;

export const DashboardData = createDashboardData({
  id: 'preview',
  name: 'Sajibur',
  role: 'tenant',
  status: 'active',
});

export interface MobileDashboardSummary {
  tenant?: {
    id?: string;
    name?: string;
    status?: string;
    propertyName?: string;
    propertyCity?: string;
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

const formatMoney = (amount = 0) => `Rs ${amount.toLocaleString('en-IN')}`;

const percentOf = (value = 0, total = 0) => {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

export function createDashboardData(user?: User | null) {
  const role = user?.role || randomFrom(['owner', 'manager', 'tenant'] as const);
  const displayName = user?.name?.trim() || randomFrom(['Raj', 'Aman', 'Priya', 'Sajibur']);
  const activeComplaints = randomInt(0, 5);
  const managerDisplayName =
    role === 'manager'
      ? displayName
      : role === 'tenant'
        ? 'Property Team'
        : 'Manager Team';
  const managerDisplayLabel =
    role === 'manager'
      ? 'MANAGER'
      : role === 'tenant'
        ? 'SUPPORT TEAM'
        : 'OPERATIONS';

  const roleConfig = {
    owner: {
      statusLabel: 'Owner dashboard',
      statusBadge: 'ADMIN',
      rentTitle: 'Monthly Collection',
      rentDue: `${randomInt(62, 94)}% collected this month`,
      amount: randomAmount(85000, 280000),
      period: '/ month',
      rentStatus: 'Live',
      propertyName: randomFrom(['SUNRISE PG NETWORK', 'URBAN OAKS RESIDENCY', 'BLUEBELL HOSTELS']),
      roomInfo: `${randomInt(18, 64)} Rooms | ${randomInt(88, 220)} Beds`,
      roomType: `${randomInt(72, 96)}% Occupancy`,
      managerLabel: managerDisplayLabel,
      managerName: managerDisplayName,
      quickActions: [],
    },
    manager: {
      statusLabel: 'Manager dashboard',
      statusBadge: 'ON DUTY',
      rentTitle: 'Today Collection',
      rentDue: `${randomInt(4, 18)} payments pending today`,
      amount: randomAmount(12000, 65000),
      period: '/ today',
      rentStatus: 'Pending',
      propertyName: randomFrom(['URBAN OAKS RESIDENCY', 'METRO STAY PG', 'NORTH STAR HOSTEL']),
      roomInfo: `${randomInt(8, 28)} Vacant Beds | ${randomInt(1, 7)} Notices`,
      roomType: 'Daily Operations',
      managerLabel: managerDisplayLabel,
      managerName: managerDisplayName,
      quickActions: [
        { id: 'tenants', label: 'Add Tenant', icon: 'account-plus' },
        { id: 'rooms', label: 'Rooms', icon: 'bed' },
        { id: 'complaints', label: 'Issues', icon: 'alert-circle' },
        { id: 'profile', label: 'Profile', icon: 'account-circle' },
      ],
    },
    tenant: {
      statusLabel: 'KYC Verified Tenant',
      statusBadge: 'ACTIVE',
      rentTitle: randomFrom(['Current Rent', 'September Rent', 'October Rent']),
      rentDue: randomFrom(['Due on Oct 05, 2026', 'Due in 4 days', 'Payment confirmation pending']),
      amount: randomAmount(6500, 18000),
      period: '/ month',
      rentStatus: randomFrom(['Unpaid', 'Partial', 'Paid']),
      propertyName: randomFrom(['URBAN OAKS RESIDENCY', 'GREEN VIEW PG', 'METRO STAY PG']),
      roomInfo: `Room ${randomInt(101, 504)} | Bed ${randomFrom(['A', 'B', 'C', 'D'])}`,
      roomType: randomFrom(['Single Room', 'Double Sharing', 'Triple Sharing', 'Studio Shared']),
      managerLabel: managerDisplayLabel,
      managerName: managerDisplayName,
      quickActions: [
        { id: 'room', label: 'My Room', icon: 'bed' },
        { id: 'history', label: 'History', icon: 'clock' },
        { id: 'support', label: 'Support', icon: 'chat' },
      ],
    },
  }[role];

  return {
    user: {
      name: displayName,
      contact: user?.email || user?.loginId || user?.phone || '',
      avatar: user?.profilePhotoUrl || '',
      role,
    },
    status: {
      label: roleConfig.statusLabel,
      badge: roleConfig.statusBadge,
    },
    quickActions: roleConfig.quickActions,
    stats: [
      { id: 'rooms', label: 'Rooms', value: randomInt(18, 64).toString(), icon: 'office-building-outline', color: '#2563EB' },
      { id: 'beds', label: 'Beds', value: randomInt(80, 220).toString(), icon: 'bed-outline', color: '#0284C7' },
      { id: 'occupied', label: 'Occupied', value: `${randomInt(62, 94)}%`, icon: 'check-circle-outline', color: '#0EA5E9' },
      { id: 'issues', label: 'Issues', value: activeComplaints.toString(), icon: 'alert-circle-outline', color: '#DC2626' },
    ],
    occupancy: [
      { id: 'occupied', label: 'Occupied', value: randomInt(50, 160), total: 180, color: '#2563EB' },
      { id: 'vacant', label: 'Vacant', value: randomInt(8, 40), total: 180, color: '#0EA5E9' },
      { id: 'booked', label: 'Booked', value: randomInt(2, 18), total: 180, color: '#D97706' },
      { id: 'maintenance', label: 'Maintenance', value: randomInt(0, 9), total: 180, color: '#DC2626' },
    ],
    tenantSummary: {
      currentTenants: randomInt(18, 140),
    },
    propertySummary: {
      currentProperties: randomInt(2, 16),
    },
    rentCard: {
      title: roleConfig.rentTitle,
      dueDate: roleConfig.rentDue,
      amount: roleConfig.amount,
      period: roleConfig.period,
      status: roleConfig.rentStatus,
    },
    livingSpace: {
      propertyName: roleConfig.propertyName,
      roomInfo: roleConfig.roomInfo,
      roomType: roleConfig.roomType,
      propertyImage: `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=200&fit=crop&sig=${randomInt(1, 999)}`,
      manager: {
        name: roleConfig.managerName,
        label: roleConfig.managerLabel,
        avatar: role === 'manager' ? user?.profilePhotoUrl || '' : '',
      },
    },
    complaints: {
      activeCount: activeComplaints,
      items:
        activeComplaints === 0
          ? []
          : [
              {
                id: '1',
                title: randomFrom(['Water Issue', 'AC Not Working', 'WiFi Slow', 'Cleaning Request']),
                description: randomFrom([
                  'Team assigned and update expected today.',
                  'Complaint is being reviewed by property staff.',
                  'Technician visit scheduled.',
                ]),
                status: randomFrom(['PENDING', 'IN PROGRESS', 'RESOLVED']),
                icon: 'alert-circle',
              },
            ],
    },
    recentPayments: [
      {
        id: '1',
        title: randomFrom(['Current Month Rent', 'Security Deposit', 'Maintenance Charge']),
        date: `${randomInt(1, 25)} Jul 2026 | UPI`,
        amount: randomAmount(1200, 18000),
        status: 'SUCCESS',
        icon: 'building',
      },
      {
        id: '2',
        title: randomFrom(['Previous Rent', 'Extra Charges', 'Booking Amount']),
        date: `${randomInt(1, 25)} Jun 2026 | Cash`,
        amount: randomAmount(500, 16000),
        status: 'SUCCESS',
        icon: 'card',
      },
    ],
  };
}

export function applyMobileDashboardSummary(
  baseData: ReturnType<typeof createDashboardData>,
  summary: MobileDashboardSummary,
) {
  if (baseData.user.role === 'tenant' && summary.tenant) {
    const expectedRent = summary.rent?.monthlyExpectedRent ?? summary.tenant.rentAmount ?? 0;
    const collectedRent = summary.rent?.monthlyCollectedRent ?? 0;
    const pendingDues = summary.rent?.pendingDues ?? Math.max(0, expectedRent - collectedRent);
    const openComplaints = summary.complaints?.openComplaints ?? 0;
    const roomNumber = summary.tenant.roomNumber || '';
    const bedNumber = summary.tenant.bedNumber || '';
    const roomInfo =
      roomNumber || bedNumber
        ? `${roomNumber ? `Room ${roomNumber}` : 'No room'} | ${bedNumber ? `Bed ${bedNumber}` : 'No bed'}`
        : 'No room or bed assigned';

    return {
      ...baseData,
      status: {
        ...baseData.status,
        label: 'Tenant dashboard',
        badge: (summary.tenant.status || 'active').toUpperCase(),
      },
      rentCard: {
        title: 'Current Rent',
        dueDate: summary.rent?.dueDate
          ? `Due on ${new Date(summary.rent.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
          : 'No due date set',
        amount: formatMoney(pendingDues || expectedRent),
        period: `/ ${summary.rent?.latestStatus || 'month'}`,
        status: pendingDues > 0 ? 'Unpaid' : 'Paid',
      },
      livingSpace: {
        ...baseData.livingSpace,
        propertyName: summary.tenant.propertyName || 'No property assigned',
        roomInfo,
        roomType: summary.tenant.roomType
          ? summary.tenant.roomType.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
          : summary.tenant.bedStatus
            ? `Bed status: ${summary.tenant.bedStatus}`
            : 'Stay details',
      },
      complaints: {
        activeCount: openComplaints,
        items:
          openComplaints === 0
            ? []
            : [
                {
                  id: 'tenant-complaints-summary',
                  title: 'Open complaints',
                  description: `${openComplaints} complaint${openComplaints === 1 ? '' : 's'} currently open.`,
                  status: 'IN PROGRESS',
                  icon: 'alert-circle',
                },
              ],
      },
    };
  }

  const totalRooms = summary.rooms?.totalRooms ?? 0;
  const totalProperties = summary.properties?.totalProperties ?? baseData.propertySummary.currentProperties;
  const totalBeds = summary.beds?.totalBeds ?? 0;
  const occupiedBeds = summary.beds?.occupiedBeds ?? 0;
  const vacantBeds = summary.beds?.vacantBeds ?? 0;
  const bookedBeds = summary.beds?.bookedBeds ?? 0;
  const maintenanceBeds = summary.beds?.maintenanceBeds ?? 0;
  const activeTenants = summary.tenants?.activeTenants ?? 0;
  const expectedRent = summary.rent?.monthlyExpectedRent ?? 0;
  const collectedRent = summary.rent?.monthlyCollectedRent ?? 0;
  const pendingDues = summary.rent?.pendingDues ?? 0;
  const openComplaints = summary.complaints?.openComplaints ?? 0;
  const collectedPercent = percentOf(collectedRent, expectedRent);
  const occupiedPercent = percentOf(occupiedBeds, totalBeds);

  return {
    ...baseData,
    status: {
      ...baseData.status,
      label: baseData.user.role === 'owner' ? 'Owner dashboard' : 'Manager dashboard',
      badge: `${occupiedPercent}% occupied`,
    },
    stats: [
      { id: 'rooms', label: 'Rooms', value: totalRooms.toString(), icon: 'office-building-outline', color: '#2563EB' },
      { id: 'beds', label: 'Beds', value: totalBeds.toString(), icon: 'bed-outline', color: '#0284C7' },
      { id: 'tenants', label: 'Tenants', value: activeTenants.toString(), icon: 'account-group-outline', color: '#0EA5E9' },
      { id: 'issues', label: 'Issues', value: openComplaints.toString(), icon: 'alert-circle-outline', color: '#DC2626' },
    ],
    occupancy: [
      { id: 'occupied', label: 'Occupied', value: occupiedBeds, total: totalBeds, color: '#2563EB' },
      { id: 'vacant', label: 'Vacant', value: vacantBeds, total: totalBeds, color: '#0EA5E9' },
      { id: 'booked', label: 'Booked', value: bookedBeds, total: totalBeds, color: '#D97706' },
      { id: 'maintenance', label: 'Maintenance', value: maintenanceBeds, total: totalBeds, color: '#DC2626' },
    ],
    rentCard: {
      title: 'Monthly Collection',
      dueDate: `${collectedPercent}% collected this month`,
      amount: formatMoney(collectedRent),
      period: `of ${formatMoney(expectedRent)}`,
      status: pendingDues > 0 ? 'Pending' : 'Clear',
    },
    livingSpace: {
      ...baseData.livingSpace,
      roomInfo: `${totalRooms} Rooms | ${totalBeds} Beds`,
      roomType: `${occupiedPercent}% Occupancy`,
    },
    tenantSummary: {
      currentTenants: activeTenants,
    },
    propertySummary: {
      currentProperties: totalProperties,
    },
    complaints: {
      activeCount: openComplaints,
      items:
        openComplaints === 0
          ? []
          : [
              {
                id: 'complaints-summary',
                title: 'Open complaints',
                description: `${openComplaints} issue${openComplaints === 1 ? '' : 's'} need follow-up from the team.`,
                status: 'IN PROGRESS',
                icon: 'alert-circle',
              },
            ],
    },
  };
}

export const TabBarItems = [
  { id: 'home', label: 'HOME', icon: 'home' },
  { id: 'rent', label: 'RENT', icon: 'calendar' },
  { id: 'support', label: 'SUPPORT', icon: 'support' },
  { id: 'profile', label: 'PROFILE', icon: 'user' },
  { id: 'logout', label: 'LOGOUT', icon: 'logout' },
] as const;

export function getTabBarItems(role: User['role']) {
  if (role === 'owner') {
    return [
      { id: 'home', label: 'HOME', icon: 'home' },
      { id: 'reports', label: 'REPORTS', icon: 'reports' },
      { id: 'managers', label: 'MANAGERS', icon: 'managers' },
      { id: 'account', label: 'OWNER', icon: 'user' },
      { id: 'logout', label: 'LOGOUT', icon: 'logout' },
    ] as const;
  }

  if (role === 'manager') {
    return [
      { id: 'home', label: 'HOME', icon: 'home' },
      { id: 'rooms', label: 'ROOMS', icon: 'rooms' },
      { id: 'queries', label: 'QUERIES', icon: 'issues' },
      { id: 'reports', label: 'REPORTS', icon: 'reports' },
      { id: 'profile', label: 'PROFILE', icon: 'user' },
    ] as const;
  }

  return TabBarItems;
}

export const AppInfo = {
  signInTitle: 'Welcome Back',
  signInSubtitle: 'Choose your role and log in with email or assigned ID.',
} as const;
