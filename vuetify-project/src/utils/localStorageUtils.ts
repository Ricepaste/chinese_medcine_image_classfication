// src/utils/localStorageUtils.ts

/**
 *
 * @param key The key to be identify in localStorage
 * @returns The parsed **state** from localStorage or **null** if not found or error occurred
 */
export function loadStateFromLocalUtil<T>(key: string): T | null {
  const storedState = localStorage.getItem(key)
  if (storedState) {
    try {
      const parsedState = JSON.parse(storedState) as T
      return parsedState
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage:`, e)
      localStorage.removeItem(key) // Remove invalid cache
      return null
    }
  }
  return null
}

// Leave it here so everyone can see how unnecessary this is
/**
 *
 * @param key The key to be identify in localStorage
 * @param state The state to be saved
 * @returns An empty object if successful, or throws an error if failed
 */
// export function saveStateToLocalUtil<T>(key: string, state: T): void {
//   localStorage.setItem(key, JSON.stringify(state))
//   console.log(`${key} saved to localStorage.`)
// }
