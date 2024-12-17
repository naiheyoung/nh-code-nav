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
const unit = '$'
const prefix = 'codenav  ~\r\ncopy functionality is currently not supported.\r\ntype help to get started.'
const systemCommand = new Map<string, Function>()
// only valid commands will be saved
const historyCommand = new Set<string>()

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
  systemWrite('the command is incorrect, you can use help to view commands.')
  prompt()
}

// to paste
const paste = (text: string) => {

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

// enter event or commands event
const enterEvent = () => {
  console.log(currentInput)
  if (!currentInput.trimEnd()) return
  const _input = currentInput.toLowerCase().trimEnd().split(/\s+/)
  const _command = systemCommand.get(_input[0])
  if (_command) {
    historyCommand.add(_input[0])
    _command(_input[1])
    prompt()
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
  prompt(false)
  const c = content.trimEnd()
  t.write(c)
}

// listening for user input
const enableInputListener = () => {
  t.onData((input) => {
    if (input === '' || moveRegex.test(input) || !inputRegex.test(input)) return
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
    if (domEvent.key === 'ArrowUp' || domEvent.key === 'ArrowDown') {
    }
    if (domEvent.key === 'ArrowLeft') {
      domEvent.preventDefault()
    }
    if (domEvent.key === 'ArrowRight') {
      domEvent.preventDefault()
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
  }

  return { initT }
}