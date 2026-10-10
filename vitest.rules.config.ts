import { defineConfig } from 'vitest/config'

// Firestore security rules and transaction tests. Run inside the emulator:
// bun run test:rules
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_PROJECT_ID: 'arion-parking-rules-test',
    },
  },
})
