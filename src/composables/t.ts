import { ITerminalOptions, ITerminalInitOnlyOptions, Terminal } from '@xterm/xterm'
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { ImageAddon } from '@xterm/addon-image'
import { SearchAddon } from '@xterm/addon-search'
import { SerializeAddon } from '@xterm/addon-serialize'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'

let t: Terminal
const inputRegex = /^[^\r\n]*$/
const moveRegex = /\x1b\[(A|B|C|D)/
const imageRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|webp)$/i
const ignoreInputRegex = /^(||\[24~|\[23~|\[21~|\[20~|\[19~|\[18~|\[17~|\[15~|OS|OQ|OP|\[H|\[F)$/
const CursorMoveEvent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const unit = '$'
const markType = new Map<MarkType, number>()
markType.set('INFO', 36)
markType.set('ERROR', 31)
markType.set('OK', 32)
markType.set('WARN', 33)
markType.set('NONE', 30)
const markWrapper = (text: string, type: MarkType = 'INFO') => {
  return `\x1B[1;3;${markType.get(type) || markType.get('INFO')}m${text.trimEnd()}\x1B[0m`
}
const prefix = `codenav  ~\r\n${markWrapper('copy functionality is currently not supported.', 'NONE')}\r\n${markWrapper('some key actions are not processed, so it is not surprising that the default actions appear.', 'NONE')}\r\ntype ${markWrapper('help')} to get started.`
const systemCommand = new Map<string, Function>()
// only valid commands will be saved
const historyCommand = new Set<string>()
const historyCommandArray: string[] = []
let historyCommandIndex = -1

const helpCommand = () => {
  systemWrite('📑  docs:')
  systemCommand.keys().toArray().sort().forEach(c => {
    systemWrite(`   ${c.padEnd(10)} \t print docs`)
  })
}
systemCommand.set('help', helpCommand)
systemCommand.set('h', helpCommand)
systemCommand.set('source', () => {
  systemWrite('https://github.com/naiheyoung/nh-code-nav')
})
systemCommand.set('to', (url: LinkType) => {
  if (!url) {
    systemWrite('tips: to <url>')
    return
  }
  openLink(url)
})
const clear = () => {
  t.clear()
}
systemCommand.set('cls', clear)
systemCommand.set('clear', clear)
systemCommand.set('c', clear)
systemCommand.set('history', () => {
  historyCommand.forEach((c) => {
    systemWrite(c)
  })
})
const imageCommand = (imgUrl: string) => {
  if (imageRegex.test(imgUrl)) {
    const imageSequence = `\x1b]1337;File=inline=1:${imgUrl}\x1b\\`
    systemWrite(imageSequence)
    return
  }
  systemWrite('Invalid Image Link.')
}
systemCommand.set('image', imageCommand)
systemCommand.set('img', imageCommand)
systemCommand.set('pic', imageCommand)

let currentInput = ''
const tConfig: ITerminalOptions & ITerminalInitOnlyOptions = {
  theme: {
    foreground: '#ffffff',
    background: '#141414',
    cursor: '#646cff',
    selectionBackground: '#ffffff',
    selectionForeground: '#141414'
  },
  cursorBlink: true,
  cursorStyle: 'underline',
  cursorWidth: 3,
  cursorInactiveStyle: 'bar',
  disableStdin: false,
  fontFamily: 'JetBrains Mono'
}

const prompt = (hasUnit: boolean = true) => {
  if (!t) return
  hasUnit ? t.write(`\r\n${unit} `) : t.write('\r\n')
}

// bad command
const badCommand = () => {
  systemWrite(`the command is incorrect, you can use ${markWrapper('help')} or ${markWrapper('h')} to view commands.`)
  prompt()
}

// todo: to paste
const paste = (text: string) => {
  const _text = text.trimEnd()

}

// to copy
const copy = () => {

}

// open link
const openLink = (url: LinkType) => {
  prompt()
  if ('open' in window) {
    window.open(url, '_blank')
  } else {
    const _a = document.createElement('a')
    _a.href = url
    _a.target = '_blank'
    _a.click()
    _a.remove()
  }
}

// get user input
const getUserInput = () => {
  return t.buffer.active.getLine(t.buffer.active.cursorY)?.getCell(t.buffer.active.cursorX)?.getChars().trimEnd()
}

// todo: Pinyin placeholder processing
const pinyinInputHandler = () => {

}

// enter event or commands event
const enterEvent = () => {
  console.log(currentInput)
  if (!currentInput.trimEnd()) return
  const _input = currentInput.toLowerCase().trimEnd().split(/\s+/)
  const _command = systemCommand.get(_input[0])
  if (_command) {
    if (!historyCommand.has(_input[0])) {
      historyCommand.add(_input[0])
      historyCommandArray.push(_input[0])
    }
    _command(_input[1])
    prompt()
    // if it's -1 here, then you need to modify the relevant logic in `historyInput`
    historyCommandIndex = historyCommand.size
  } else {
    badCommand()
  }
  currentInput = ''
}

// backspace event
const backspaceEvent = () => {
  if (currentInput) {
    currentInput = currentInput.slice(0, currentInput.length - 1)
    t.write('\b \b')
  }
}

// output
const systemWrite = (content: string, unit: boolean = true, type: WriteType = 'd') => {
  unit ? prompt(false) : prompt(true)
  const c = content.trimEnd()
  t.write(c)
}

// ctrl + r
const reloadEvent = () => {
  if ('location' in window) {
    window.location.reload()
  }
}

const historyInput = (mark: number) => {
  if (historyCommand.size <= 0) return
  if (mark < 0) {
    historyCommandIndex = (historyCommandIndex + 1) > historyCommandArray.length - 1 ? 0 : historyCommandIndex + 1
  } else {
    historyCommandIndex = (historyCommandIndex - 1) < 0 ? historyCommandArray.length - 1 : historyCommandIndex - 1
  }
  const _currentCommand = historyCommandArray[historyCommandIndex]
  currentInput.trimEnd().length > 0 ? t.write('\b \b'.repeat(currentInput.trimEnd().length) + _currentCommand) : t.write(_currentCommand)
  // todo: to be optimized
  currentInput = ''
  currentInput += _currentCommand
}

// listening for user input
const enableInputListener = () => {
  t.onData((input) => {
    if (ignoreInputRegex.test(input) || moveRegex.test(input) || !inputRegex.test(input)) return
    if (input === '') {
      navigator.clipboard.readText().then(text => {
        t.write(text)
        currentInput += text
      })
      return
    }
    currentInput += input
    t.write(input)
  })
}

// listening for user keyboard input
const enableKeyboardListener = () => {
  t.onKey(({ domEvent }) => {
    if (domEvent.key === 'Backspace') {
      backspaceEvent()
    }
    if (domEvent.key === 'Enter') {
      enterEvent()
    }
    if (domEvent.key === 'r' && domEvent.ctrlKey) {
      reloadEvent()
    }
    if (domEvent.key === 'F11') {
      t.write('pressed F11')
      helpCommand()
      prompt()
    }
    if (domEvent.key === 'ArrowUp') {
      historyInput(0)
    }
    if (domEvent.key === 'ArrowDown') {
      historyInput(-1)
    }
    if (CursorMoveEvent.concat(domEvent.key)) {
      return
    }
  })
}

// listening for user cursor move
const cursorMoveListener = () => {
  t.onCursorMove(() => {
    return
  })
}

// disable menu
const disableContextMenu = () => {
  useEventListener('contextmenu', (evt) => {
    evt.preventDefault()
  })
}

const resizeHandler = useDebounceFn(() => {
  t.resize(Math.floor(window.innerWidth / 10), Math.floor(window.innerHeight / 20))
}, 100)
// resize
const enableResizeListener = () => {
  useEventListener('resize', resizeHandler)
}

const fitAddon = new FitAddon()

export const useTerminal = () => {
  const initT = (target: HTMLElement) => {
    if (!t) t = new Terminal(tConfig)
    if (!target) return
    t.loadAddon(new ClipboardAddon())
    t.loadAddon(fitAddon)
    t.loadAddon(new ImageAddon())
    t.loadAddon(new SearchAddon())
    t.loadAddon(new SerializeAddon())
    t.loadAddon(new WebLinksAddon())
    t.loadAddon(new WebglAddon())
    t.open(target)
    fitAddon.fit()
    t.focus()
    t.write(prefix)
    prompt()
    enableInputListener()
    enableKeyboardListener()
    cursorMoveListener()
    // disableContextMenu()
    enableResizeListener()
  }

  return { initT }
}