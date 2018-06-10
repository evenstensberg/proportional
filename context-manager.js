const {existsSync, writeFileSync, readFileSync} = require('fs');
const {join} = require('path');
let {cwd} = process;

class ContextManager {
  constructor() {
    this._levels = new Map();
    this._cli = {};
    this._rcPath = join(cwd(), '.proportional.json');
    this._default = null;
    this._thresholdIsSet = false;
  }
  upgrade(key) {
    let selected;
    if (key) {
      this._cli = this._levels.get(key);
      return;
    }
    this._thresholdItems = [];
    this._levels.forEach((a) => {
      this._thresholdItems.push(a);
    });
    this._thresholdItems
      .sort((a, b) => {
        if (a.threshold < b.threshold) {
          return -1;
        }
        if (a.threshold > b.threshold) {
          return 1;
        }
        return 0;
      })
      .forEach((i, idx) => {
        if (this._cli && i === this._cli) {
          if (
            this._thresholdItems[idx + 1] &&
            this._cli.threshold < this._thresholdItems[idx + 1].threshold
          ) {
            selected = this._thresholdItems[idx + 1];
          }
          return;
        }
      });
    if (!selected) {
      if (this._levels.has('default')) {
        selected = this._levels.get('default');
      } else {
        if (
          this._cli === this._thresholdItems[this._thresholdItems.length - 1]
        ) {
          return;
        }
        const idx = Object.keys(this._thresholdItems).findIndex(
          (a) => this._cli === this._thresholdItems[a]
        );
        selected = this._thresholdItems[idx + 1];
      }
    }
    this._cli = selected;
  }

  levels(args) {
    if (args.length > 1) {
      args.forEach((arg) => {
        this._levels.set(arg, {});
      });
    } else {
      this._levels.set('default', {});
    }
  }
  _setArgument(name, objectToAdd) {
    if (!objectToAdd) {
      return;
    }
    const nameWithLevels = Object.keys(objectToAdd).filter((k) =>
      this._levels.has(k)
    );
    if (nameWithLevels.length > 0) {
      Object.keys(objectToAdd).forEach((k) => {
        if (this._levels.has(k)) {
          const oldObject = this._levels.get(k);
          const newObject = Object.assign(oldObject, {
            [name]: objectToAdd[k],
          });
          this._levels.set(k, newObject);
        } else {
          throw new Error(`${k} is not defined in ${name}.`);
        }
      });
    } else {
      if (this._levels.has('default')) {
        const oldObject = this._levels.get('default');
        const objKeysOpts = Object.values(objectToAdd);
        if (objKeysOpts.length > 0 && name === 'hook') {
          this._levels.set(
            'default',
            Object.assign(oldObject, {
              [name]: objKeysOpts.shift(),
            })
          );
        } else {
          this._levels.set(
            'default',
            Object.assign(oldObject, {
              [name]: objectToAdd,
            })
          );
        }
      } else {
        this._levels.forEach((lvl) => {
          lvl[name] = objectToAdd;
        });
      }
    }
  }
  _writeRC() {
    if (this._thresholdIsSet) {
      if (!existsSync(this._rcPath)) {
        this.count = 0;
        writeFileSync(this._rcPath, '{"count":0}', 'utf8');
      } else {
        const res = readFileSync(this._rcPath, 'utf8');
        let config = JSON.parse(res);
        config.count = parseInt(config.count.toString()) + 1;
        let maxThreshold = 0;
        this._levels.forEach((a) => {
          if (a.threshold && a.threshold > maxThreshold) {
            maxThreshold = a.threshold;
          }
        });
        if (maxThreshold >= config.count) {
          this.count = config.count;
          writeFileSync(this._rcPath, JSON.stringify(config), 'utf8');
        }
      }
    }
  }
  _getContext() {
    let selected;
    if (this._default) {
      return this._levels.get(this._default);
    }
    this._thresholdItems = [];
    this._levels.forEach((a) => {
      this._thresholdItems.push(a);
    });
    this._thresholdItems
      .sort((a, b) => {
        if (a.threshold < b.threshold) {
          return 1;
        }
        if (a.threshold > b.threshold) {
          return -1;
        }
        return 0;
      })
      .forEach((i) => {
        if (this.count === 0) {
          selected = i;
          return;
        }
        if (i.threshold >= this.count) {
          selected = i;
        }
      });
    if (!selected) {
      if (this._levels.has('default')) {
        selected = this._levels.get('default');
      } else {
        selected = this._thresholdItems[0];
      }
    }
    return selected;
  }
  _parseInput(args) {
    return require('yargs-parser')(args, this._cli.options);
  }
  _setArray(key, choices, val) {
    if (choices.includes(val)) {
      this._CLIArgs[key] = val;
    }
  }
  _setAlias(key, value) {
    if (this._CLIArgs[value] !== undefined) {
      this._CLIArgs[key] = this._CLIArgs[value];
    }
  }
  _setRemainingOpts(args) {
    if (args['v'] || args['version']) {
      return this._cli['version'];
    }
    const opts = this._cli.options || [];
    Object.keys(opts).forEach((opt) => {
      const props = opts[opt];
      if (props.choices) {
        this._setArray(opt, props.choices, args[opt]);
      }
      if (opts[opt].alias !== undefined) {
        this._setAlias(opt, opts[opt].alias);
      }
    });
    return null;
  }
  _showHelp() {
    let retstring = '\n' + this._cli['usage'] + '\n\n';
    retstring += '-'.repeat(process.stdout.columns / 2);
    retstring += 'OPTIONS';
    retstring += '-'.repeat(process.stdout.columns / 2 - 'OPTIONS'.length);
    retstring += '\n\n';
    if (this._cli['help'] && this._cli.options) {
      const optionsKeys = Object.keys(this._cli.options);
      optionsKeys.forEach((opt) => {
        retstring += ' ' + opt;
        retstring += '\t ';
      });
      retstring += '\n';
      retstring += '-'.repeat(process.stdout.columns);
      return retstring;
    }
  }
  _parseArgs(args) {
    let helpOrH = args['h'] || args['help'] || args['--help'];
    if (helpOrH) {
      const objKeyArgs = Object.keys(args);
      const helpIdx = objKeyArgs.indexOf('help') + 1;
      let outputArg;
      if (objKeyArgs[helpIdx] === undefined) {
        if (args['help'] !== 'true') {
          outputArg = args['help'];
        } else {
          return this._showHelp();
        }
      } else if (objKeyArgs[helpIdx].indexOf('--') >= 0) {
        outputArg = objKeyArgs[helpIdx].substr(2);
      } else {
        outputArg = objKeyArgs[helpIdx];
      }
      if (
        this._cli.options &&
        Object.keys(this._cli.options).includes(outputArg)
      ) {
        let retstring = '\n ';
        retstring += outputArg;
        retstring += '\n\n ';
        retstring += this._cli.options[outputArg].describe;
        return retstring;
      }
      return this._showHelp();
    }
    return this._setRemainingOpts(args);
  }
  _ContextShouldUpdate() {
    if (Object.getOwnPropertyNames(this._cli).length === 0) {
      this._cli = this._getContext();
    }
  }
  _ArgsShouldUpdate(args) {
    if (args) {
      let actionIsUpgradeOrDown = false;
      args = args
        .map((arg) => {
          if (this._levels.has(arg)) {
            actionIsUpgradeOrDown = true;
            this.upgrade(arg);
            arg = null;
          }
          if (arg && arg.indexOf('downgrade') >= 0) {
            this.downgrade();
            actionIsUpgradeOrDown = true;
            arg = null;
          }
          if (arg && arg.indexOf('upgrade') >= 0) {
            this.upgrade();
            actionIsUpgradeOrDown = true;
            arg = null;
          }
          if (arg && !actionIsUpgradeOrDown && arg.indexOf('--') < 0) {
            return '--' + arg;
          }
          return arg;
        })
        .filter((a) => a);
      if (actionIsUpgradeOrDown) {
        process.argv = [...process.argv.slice(0, 2), ...args];
      }
    }
    this._updatedArgs = args;
  }
  _processArgs(args) {
    this._ArgsShouldUpdate(args);
    this._CLIArgs = this._parseInput(this._updatedArgs);
  }
  _resetOrReturnContext(key) {
    if (key) {
      this._cli = this._levels.get(key);
      return;
    }
    this._thresholdItems = [];
    this._levels.forEach((a) => {
      this._thresholdItems.push(a);
    });
  }
  defaultLevel(lvl) {
    this._default = lvl;
    this._cli = this._getContext();
  }
  hook(hookObject) {
    this._setArgument('hook', hookObject);
  }
  usage(usageObject) {
    this._setArgument('usage', usageObject);
  }
  options(optionsObject) {
    this._setArgument('options', optionsObject);
  }
  version(versionObject) {
    this._setArgument('version', versionObject);
  }
  alias(aliasObject) {
    this._setArgument('alias', aliasObject);
  }
  help(helpObject) {
    this._setArgument('help', helpObject);
  }
  threshold(thresholdObject) {
    this._thresholdIsSet = true;
    this._setArgument('threshold', thresholdObject);
  }
  downgrade(key) {
    let selected;
    if (key) {
      this._cli = this._levels.get(key);
      return;
    }
    this._thresholdItems = [];
    this._levels.forEach((a) => {
      this._thresholdItems.push(a);
    });
    this._thresholdItems
      .sort((a, b) => {
        if (a.threshold < b.threshold) {
          return -1;
        }
        if (a.threshold > b.threshold) {
          return 1;
        }
        return 0;
      })
      .forEach((i, idx) => {
        if (this._cli && i === this._cli) {
          if (!this._cli.threshold && this._thresholdItems[idx - 1]) {
            selected = this._thresholdItems[idx - 1];
          } else if (
            this._thresholdItems[idx - 1] &&
            this._cli.threshold < this._thresholdItems[idx - 1].threshold
          ) {
            selected = this._thresholdItems[idx - 1];
          }
          return;
        }
      });
    if (!selected) {
      if (this._levels.has('default')) {
        selected = this._levels.get('default');
      } else {
        const idx = Object.keys(this._thresholdItems).findIndex(
          (a) => this._cli === this._thresholdItems[a]
        );
        if (this._thresholdItems[idx - 1]) {
          selected = this._thresholdItems[idx - 1];
        } else {
          selected = this._cli;
        }
      }
    }
    this._cli = selected;
  }
}

module.exports = ContextManager;
