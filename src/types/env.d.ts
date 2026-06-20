declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_BASE_URL: string;
    }
  }
}

export {};
