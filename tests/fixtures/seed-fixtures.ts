export const seedFixtures = {
  home: {
    id: "home_seed_1",
    code: "HOME-SEED-1",
    name: "Hope Home",
    timezone: "UTC"
  },
  users: {
    admin: {
      id: "user_admin_1",
      email: "admin@ohms.local",
      fullName: "Admin User",
      passwordHash: "seed_hash_admin"
    },
    caregiver: {
      id: "user_caregiver_1",
      email: "caregiver@ohms.local",
      fullName: "Caregiver User",
      passwordHash: "seed_hash_caregiver"
    }
  },
  child: {
    id: "child_seed_1",
    firstName: "Jane",
    lastName: "Doe"
  },
  sync: {
    deviceId: "device_seed_1",
    outboxItems: [
      {
        clientEventId: "offline_ev_1",
        entityType: "attendance",
        payload: {
          childId: "child_seed_1",
          status: "present"
        }
      },
      {
        clientEventId: "offline_ev_2",
        entityType: "meal_log",
        payload: {
          childId: "child_seed_1",
          type: "breakfast"
        }
      }
    ]
  }
};
