# Proportional

`Proportional` is a library for CLI tools intended to make users having a better time. Many new users struggle when starting with advanced tools or tools in general, most likely due the complexity of many tools out there today.

A common approach to this problem is 0CJS. It consists of only requiring the bare minimum for users to use the tool you have created. This tool is an extention of that. By gradually adapting the CLI for users over time or by invoking a command, the developer experience could become better over time. 


# Usage

The library exposes a simple interface derived from [`yargs`](https://github.com/yargs/yargs). By using yargs's convention when creating your CLI, you will be able to create a CLI within a simple scope of yargs. Not all methods from yargs methods are supported.

# Installation

### Using npm
`$ npm install --save proportional`
### Using yarn
`$ yarn add proportional`

# Example
```js
const Proportional = require('proportional');

const CLI = new Proportional();

CLI.levels(['webpagetest', 'lighthouse', 'psi']);

CLI.threshold({
  webpagetest: 1,
  lighthouse: 2,
  psi: 3,
});

CLI.hook({
  webpagetest: () => require('./node_modules/.bin/webpagetest'),
  lighthouse: () => require('./node_modules/.bin/lighthouse'),
  psi: () => require('./node_modules/.bin/psi'),
});

CLI.run(process.argv.slice(2));
```

More examples are found in the `examples` directory.

# API

### threshold

Threshold is a way to specify how many times the current CLI should be used before it should switch to another higher alternative. By setting the threshold, you could allow users to gradually shift towards a more complex CLI over time.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.threshold({
  levelOne: 10,
  levelTwo: 20,
  levelThree: 30,
});

```
### usage

Usage works as it does with yargs. The usage option is visible when the user types a wrong command and it accepts an object.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.usage({
  levelOne: 'Seems like you missed the init option! try again with init!',
  levelTwo: 'Ipsum Lorem',
  levelThree: 'This is way to advanced'
});
```

### version

Pass the version number to be used when outputting the help flag.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.version({
  levelOne: '1.2.3',
  levelTwo: '4.5.6',
  levelThree: '8.9.10'
});
```

```js
CLI.version('1.34.5');
```

### levels

By setting `levels`, you specify which CLI should be run. In order for the tool to know which cli to change to, you need to match this option(array) with `threshold` and/or `hook`.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.levels(['levelOne', 'levelTwo', 'levelThree']);
```
### defaultLevel

You can specify a default level for your tool to start using.
```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.levels(['levelOne', 'levelTwo', 'levelThree']);
CLI.defaultLevel('levelOne');
```

### hook

This option allows you to tap into other CLI's when creating your tool. The function expects an object with the keys being your levels and the value being the module you are going to use. This tool handles `process.env` for you, so if you combine the tool with arguments that are supported in this libary, it will not be used in the module you are using.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.hook({
  levelOne: () => require('./node_modules/.bin/easy'),
  levelTwo: () => require('./node_modules/.bin/medium'),
  levelThree: () => require('./node_modules/.bin/hard'),
});
```

### alias

Alias works as yargs handles aliases. You can either supply it through options, or with an own flag.

```js
CLI.alias({
  k: 'k',
  p: 'p'
});
```

### options

Options are handled the same way as yargs handles an option, however, this follows the key/value convention where you need to pass the level as the key and the option to be the value.

```js
const Proportional = require('proportional');
const CLI = new Proportional();

CLI.options({
  levelOne: {
    alright: {
      type: 'boolean',
      alias: 'a',
      describe: 'AaA?',
    },
    bC00l: {
      type: 'boolean',
      describe: 'B c00l :)',
    },
  },
  levelTwo: {...}
})
```

### upgrade

If you want to switch to another CLI at runtime you can use the `upgrade` flag, or use the built in function to do it at "compile-time".

If you use the function, you can either supply a string(being the level you want to change to), or call the function without any arguments, where the tool will read your `.proportional` configuration to determine which CLI to swap to.

```js

const Proportional = require('proportional');
const CLI = new Proportional();

CLI.upgrade("levelOne");
```

```js

const Proportional = require('proportional');
const CLI = new Proportional();

CLI.upgrade();
```

`$ node ./my/path.js upgrade --help`

### downgrade


Downgrade works similarly as `upgrade`.

```js

const Proportional = require('proportional');
const CLI = new Proportional();

CLI.downgrade("levelOne");
```

```js

const Proportional = require('proportional');
const CLI = new Proportional();

CLI.downgrade();
```

`$ node ./my/path.js downgrade --help`

### run

To run the CLI, you will need to invoke the `run` method. If you built the tool using options, aliases et al. from `proportional`, `output` and `argv` is given back to you. If you use `hooks`, nothing is returned. To handle both cases (hooks and your own CLI), see `examples/webpack`.

```js

const Proportional = require('proportional');
const CLI = new Proportional();

// or const results = CLI.run(process.argv.slice(2))
CLI.run(process.argv.slice(2));
```

### misc

You can also pass the level to the CLI you want to swap to if you want to. If you have set the level `thisLevel` programatically, but your current level is `previousLevel` you can swap to the level by calling `node ./path/to/myCLI.js thisLevel <args>`.

`$ node ./my/path.js levelTwo --help`

# todo

- Use private methods for store
- Expose more yargs methods / bridge to other tools or build the API from scratch
- Swap Environment based on current node version, i.e node v6 should require a different module than v8.
