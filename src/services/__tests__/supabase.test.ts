type LoadSupabaseOptions = {
  platformOS: "web" | "ios" | "android";
  withWindowLocalStorage?: boolean;
  envUrl?: string;
  envKey?: string;
  extraUrl?: string;
  extraKey?: string;
};

type LoadSupabaseResult = {
  createClient: jest.Mock;
  asyncStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
  };
  error: unknown;
};

const originalWindow = (globalThis as any).window;
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function loadSupabase(options: LoadSupabaseOptions): LoadSupabaseResult {
  const {
    platformOS,
    withWindowLocalStorage = false,
    envUrl,
    envKey,
    extraUrl,
    extraKey,
  } = options;

  if (envUrl === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_URL = envUrl;
  }

  if (envKey === undefined) {
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = envKey;
  }

  if (withWindowLocalStorage) {
    (globalThis as any).window = {
      localStorage: {
        getItem: jest.fn((key: string) => (key === "k" ? "v" : null)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    };
  } else {
    delete (globalThis as any).window;
  }

  const createClient = jest.fn(() => ({ mocked: true }));
  const asyncStorage = {
    getItem: jest.fn(async (_key: string) => "async-value"),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  };

  jest.resetModules();
  jest.doMock("react-native", () => ({
    Platform: { OS: platformOS },
  }));
  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: {
      expoConfig: {
        extra: {
          supabaseUrl: extraUrl,
          supabaseAnonKey: extraKey,
        },
      },
    },
  }));
  jest.doMock("@supabase/supabase-js", () => ({
    createClient,
  }));
  jest.doMock("react-native-url-polyfill/auto", () => ({}));
  jest.doMock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: asyncStorage,
  }));

  let error: unknown = null;
  jest.isolateModules(() => {
    try {
      require("../supabase");
    } catch (err) {
      error = err;
    }
  });

  return { createClient, asyncStorage, error };
}

describe("services/supabase", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }

    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });

  it("uses memory storage on web SSR when window is unavailable", async () => {
    const { createClient, error } = loadSupabase({
      platformOS: "web",
      withWindowLocalStorage: false,
      envUrl: "https://env.supabase.co",
      envKey: "env-key",
    });

    expect(error).toBeNull();
    expect(createClient).toHaveBeenCalledTimes(1);

    const clientOptions = createClient.mock.calls[0][2] as any;
    const storage = clientOptions.auth.storage;

    await storage.setItem("k", "v");
    await expect(storage.getItem("k")).resolves.toBe("v");
    await storage.removeItem("k");
    await expect(storage.getItem("k")).resolves.toBeNull();
  });

  it("uses localStorage adapter on web browser runtime", async () => {
    const { createClient, error } = loadSupabase({
      platformOS: "web",
      withWindowLocalStorage: true,
      envUrl: "https://env.supabase.co",
      envKey: "env-key",
    });

    expect(error).toBeNull();
    const clientOptions = createClient.mock.calls[0][2] as any;
    const storage = clientOptions.auth.storage;
    const localStorageMock = (globalThis as any).window.localStorage;

    await storage.setItem("k", "v");
    await expect(storage.getItem("k")).resolves.toBe("v");
    await storage.removeItem("k");

    expect(localStorageMock.setItem).toHaveBeenCalledWith("k", "v");
    expect(localStorageMock.getItem).toHaveBeenCalledWith("k");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("k");
  });

  it("uses AsyncStorage adapter on native platforms", async () => {
    const { createClient, asyncStorage, error } = loadSupabase({
      platformOS: "ios",
      envUrl: "https://env.supabase.co",
      envKey: "env-key",
    });

    expect(error).toBeNull();
    const clientOptions = createClient.mock.calls[0][2] as any;
    const storage = clientOptions.auth.storage;

    await storage.getItem("native-key");
    await storage.setItem("native-key", "native-value");
    await storage.removeItem("native-key");

    expect(asyncStorage.getItem).toHaveBeenCalledWith("native-key");
    expect(asyncStorage.setItem).toHaveBeenCalledWith("native-key", "native-value");
    expect(asyncStorage.removeItem).toHaveBeenCalledWith("native-key");
  });

  it("throws when Supabase URL or key is missing", () => {
    const { createClient, error } = loadSupabase({
      platformOS: "web",
      withWindowLocalStorage: false,
      extraUrl: undefined,
      extraKey: undefined,
      envUrl: undefined,
      envKey: undefined,
    });

    expect(createClient).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Supabase config missing");
  });
});
