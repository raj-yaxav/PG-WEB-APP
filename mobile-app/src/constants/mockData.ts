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

export function createDashboardData(user?: User | null) {
  const role = user?.role || randomFrom(['owner', 'manager', 'tenant'] as const);
  const firstName = user?.name?.split(' ')[0] || randomFrom(['Raj', 'Aman', 'Priya', 'Sajibur']);
  const activeComplaints = randomInt(0, 5);

  const roleConfig = {
    owner: {
      statusLabel: 'Owner Control Center',
      statusBadge: 'ADMIN',
      rentTitle: 'Monthly Collection',
      rentDue: `${randomInt(62, 94)}% collected this month`,
      amount: randomAmount(85000, 280000),
      period: '/ month',
      rentStatus: 'Live',
      propertyName: randomFrom(['SUNRISE PG NETWORK', 'URBAN OAKS RESIDENCY', 'BLUEBELL HOSTELS']),
      roomInfo: `${randomInt(18, 64)} Rooms | ${randomInt(88, 220)} Beds`,
      roomType: `${randomInt(72, 96)}% Occupancy`,
      managerLabel: 'ACTIVE MANAGER',
      managerName: randomFrom(['Alex Rivera', 'Neha Singh', 'Rohit Sharma']),
      quickActions: [
        { id: 'properties', label: 'Properties', icon: 'office-building' },
        { id: 'tenants', label: 'Tenants', icon: 'account-group' },
        { id: 'dues', label: 'Dues', icon: 'cash-clock' },
        { id: 'reports', label: 'Reports', icon: 'chart-box' },
      ],
    },
    manager: {
      statusLabel: 'Manager Operations',
      statusBadge: 'ON DUTY',
      rentTitle: 'Today Collection',
      rentDue: `${randomInt(4, 18)} payments pending today`,
      amount: randomAmount(12000, 65000),
      period: '/ today',
      rentStatus: 'Pending',
      propertyName: randomFrom(['URBAN OAKS RESIDENCY', 'METRO STAY PG', 'NORTH STAR HOSTEL']),
      roomInfo: `${randomInt(8, 28)} Vacant Beds | ${randomInt(1, 7)} Notices`,
      roomType: 'Daily Operations',
      managerLabel: 'PROPERTY',
      managerName: randomFrom(['Block A', 'Girls Wing', 'Main Branch']),
      quickActions: [
        { id: 'beds', label: 'Beds', icon: 'bed' },
        { id: 'payments', label: 'Payments', icon: 'wallet' },
        { id: 'complaints', label: 'Complaints', icon: 'alert-circle' },
        { id: 'tenants', label: 'Tenants', icon: 'account-multiple' },
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
      managerLabel: 'MANAGER',
      managerName: randomFrom(['Alex Rivera', 'Neha Singh', 'Rohit Sharma']),
      quickActions: [
        { id: 'room', label: 'My Room', icon: 'bed' },
        { id: 'rent', label: 'Pay Rent', icon: 'wallet' },
        { id: 'history', label: 'History', icon: 'clock' },
        { id: 'support', label: 'Support', icon: 'chat' },
      ],
    },
  }[role];

  return {
    user: {
      name: firstName,
      avatar: `https://i.pravatar.cc/150?img=${randomInt(3, 60)}`,
      role,
    },
    status: {
      label: roleConfig.statusLabel,
      badge: roleConfig.statusBadge,
    },
    quickActions: roleConfig.quickActions,
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
        avatar: `https://i.pravatar.cc/150?img=${randomInt(10, 70)}`,
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

export const TabBarItems = [
  { id: 'home', label: 'HOME', icon: 'home' },
  { id: 'rent', label: 'RENT', icon: 'calendar' },
  { id: 'chat', label: 'CHAT', icon: 'chat' },
  { id: 'profile', label: 'PROFILE', icon: 'user' },
  { id: 'logout', label: 'LOGOUT', icon: 'logout' },
] as const;

export const AppInfo = {
  signInTitle: 'Welcome Back',
  signInSubtitle: 'Choose your role and log in with email or assigned ID.',
} as const;
