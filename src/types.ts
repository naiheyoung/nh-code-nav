type ThemeSchema = 'dark' | 'light'

type BackgroundImageItem =
  | 'boy01'
  | 'boy02'
  | 'boy03'
  | 'girl01'
  | 'girl02'
  | 'girl03'

interface CodeNavConfig {
  theme: ThemeSchema
  bgImage: BackgroundImageItem | `https://${string}`
  currentMode: 't' | 'w'
  searchProvider: 'google' | 'baidu' | 'bing'
}

type LinkType = `https://${string}` | `http://${string}`

type WriteType = 'd' | 'info' | 'warn'

type MoveEvent = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

type MarkType = 'INFO' | 'ERROR' | 'OK' | 'WARN' | 'NONE'

type Command = {
  exec: Function
  desc: string
}
