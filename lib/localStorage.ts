// Local storage utility for offline functionality
export class LocalStorage {
  private static prefix = 'pt_block_';

  static setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Data service for offline functionality
export class DataService {
  // Branches
  static getBranches() {
    return LocalStorage.getItem('branches', [
      { id: 'branch-1', name: '강남점' },
      { id: 'branch-2', name: '홍대점' },
      { id: 'branch-3', name: '건대점' }
    ]);
  }

  static saveBranches(branches: any[]) {
    LocalStorage.setItem('branches', branches);
  }

  // Users
  static getUsers() {
    return LocalStorage.getItem('users', [
      {
        id: 'admin-1',
        name: '관리자',
        email: 'admin@ptblock.com',
        role: 'admin',
        assignedBranchIds: [],
        trainerProfileId: null
      }
    ]);
  }

  static saveUsers(users: any[]) {
    LocalStorage.setItem('users', users);
  }

  // Members
  static getMembers() {
    return LocalStorage.getItem('members', []);
  }

  static saveMembers(members: any[]) {
    LocalStorage.setItem('members', members);
  }

  // Trainers
  static getTrainers() {
    return LocalStorage.getItem('trainers', []);
  }

  static saveTrainers(trainers: any[]) {
    LocalStorage.setItem('trainers', trainers);
  }

  // Programs
  static getPrograms() {
    return LocalStorage.getItem('programs', []);
  }

  static savePrograms(programs: any[]) {
    LocalStorage.setItem('programs', programs);
  }

  // Sessions
  static getSessions() {
    return LocalStorage.getItem('sessions', []);
  }

  static saveSessions(sessions: any[]) {
    LocalStorage.setItem('sessions', sessions);
  }

  // Program Presets
  static getProgramPresets() {
    return LocalStorage.getItem('program_presets', [
      {
        id: 'preset-1',
        name: '기본 PT 10회',
        totalAmount: 500000,
        totalSessions: 10,
        branchId: null
      },
      {
        id: 'preset-2',
        name: '기본 PT 20회',
        totalAmount: 900000,
        totalSessions: 20,
        branchId: null
      }
    ]);
  }

  static saveProgramPresets(presets: any[]) {
    LocalStorage.setItem('program_presets', presets);
  }

  // Audit Logs
  static getAuditLogs() {
    return LocalStorage.getItem('audit_logs', []);
  }

  static saveAuditLogs(logs: any[]) {
    LocalStorage.setItem('audit_logs', logs);
  }

  // Current User
  static getCurrentUser() {
    return LocalStorage.getItem('current_user', null);
  }

  static saveCurrentUser(user: any) {
    LocalStorage.setItem('current_user', user);
  }

  static clearCurrentUser() {
    LocalStorage.removeItem('current_user');
  }
}

// Initialize default data
export const initializeData = () => {
  // Check if branches exist, if not create default ones
  const existingBranches = DataService.getBranches();
  if (existingBranches.length === 0) {
    const defaultBranches = [
      { id: 'branch-1', name: '강남점', createdAt: new Date().toISOString() },
      { id: 'branch-2', name: '홍대점', createdAt: new Date().toISOString() },
      { id: 'branch-3', name: '건대점', createdAt: new Date().toISOString() }
    ];
    DataService.saveBranches(defaultBranches);
  }

  // Check if users exist, if not create default admin
  const existingUsers = DataService.getUsers();
  if (existingUsers.length === 0) {
    const defaultBranches = DataService.getBranches();
    const adminUser = {
      id: 'admin-1',
      name: '관리자',
      email: 'admin@ptblock.com',
      role: 'admin',
      assignedBranchIds: defaultBranches.map((b: any) => b.id),
      trainerProfileId: undefined
    };
    DataService.saveUsers([adminUser]);
  }

  // Check if presets exist, if not create default ones
  const existingPresets = DataService.getProgramPresets();
  if (existingPresets.length === 0) {
    const defaultPresets = [
      { id: 'preset-1', name: '기본 PT 10회', totalAmount: 500000, totalSessions: 10, branchId: null },
      { id: 'preset-2', name: '기본 PT 20회', totalAmount: 900000, totalSessions: 20, branchId: null }
    ];
    DataService.saveProgramPresets(defaultPresets);
  }
};
