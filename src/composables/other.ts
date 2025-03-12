export class CommandMap extends Map<string, Command> {
  setCommand(key: string, exec: Function, desc: string): this {
    if (typeof exec !== 'function') {
      throw new TypeError('The type of exec argument must be Function.')
    }
    if (this.get(desc)) {
      super.set(key, {
        exec,
        desc: this.get(desc)!.desc
      })
    } else {
      super.set(key, { exec, desc })
    }
    return this
  }
}
