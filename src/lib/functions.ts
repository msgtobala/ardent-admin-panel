import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { app } from './firebase'

const DEFAULT_REGION = 'asia-south1'

const region =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || DEFAULT_REGION

export const functions = getFunctions(app, region)

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true'
) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
