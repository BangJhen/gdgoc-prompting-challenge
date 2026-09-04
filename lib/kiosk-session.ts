// A simple in-memory session store for the Kiosk Verification feature.
// Note: We attach it to the `global` object so it persists across Next.js API hot-reloads during development.

export interface KioskSession {
  id: string;
  unlocked: boolean;
  createdAt: number;
}

declare global {
  var kioskSessions: Map<string, KioskSession> | undefined;
}

const getSessionMap = () => {
  if (!global.kioskSessions) {
    global.kioskSessions = new Map<string, KioskSession>();
  }
  return global.kioskSessions;
};

export const kioskSessionStore = {
  createSession: (): string => {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const map = getSessionMap();
    map.set(id, {
      id,
      unlocked: false,
      createdAt: Date.now(),
    });
    return id;
  },

  getSession: (id: string): KioskSession | undefined => {
    return getSessionMap().get(id);
  },

  unlockSession: (id: string): boolean => {
    const map = getSessionMap();
    const session = map.get(id);
    if (session) {
      session.unlocked = true;
      map.set(id, session);
      return true;
    }
    return false;
  },

  lockSession: (id: string): boolean => {
    const map = getSessionMap();
    const session = map.get(id);
    if (session) {
      session.unlocked = false;
      map.set(id, session);
      return true;
    }
    return false;
  }
};
