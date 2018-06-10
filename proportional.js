const ContextManager = require('./context-manager');

class Proportional {
  constructor() {
    const methods = [
      'levels',
      'defaultLevel',
      'usage',
      'threshold',
      'options',
      'version',
      'alias',
      'help',
      'upgrade',
      'downgrade',
      'hook',
    ];
    this.store = [];
    methods.forEach((m, i) => {
      this[m] = function(args) {
        this.store[i] = [m, args];
      };
    });
  }
  run(args) {
    const ctx = new ContextManager();
    this.store.forEach((m) => {
      if (ctx[m[0]]) {
        ctx[m[0]](m[1]);
      }
    });
    ctx._writeRC();
    ctx._ContextShouldUpdate();
    ctx._processArgs(args);
    if (ctx._cli.hook) {
      return ctx._cli.hook(process.argv);
    }
    ctx._outputArgs = ctx._parseArgs(ctx._CLIArgs);
    return {
      argv: ctx._CLIArgs,
      output: ctx._outputArgs,
    };
  }
}

module.exports = Proportional;
