export const useConfigStore = defineStore('config-store', () => {
  let us = reactive<Partial<CodeNavConfig>>({
    theme: 'dark',
    currentMode: 't',
    searchProvider: 'google'
  })

  const getUsConfig = <K extends keyof CodeNavConfig>(key: K): CodeNavConfig[K] | undefined => {
    return us[key] as CodeNavConfig[K]
  }

  return { getUsConfig }
})