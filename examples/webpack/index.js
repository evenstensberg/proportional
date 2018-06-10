#!/usr/bin/env node
const proportional = require('../../proportional');

const CLI = new proportional();

CLI.levels(['beginner', 'intermediate', 'expert']);
CLI.usage({
  beginner: 'mylibrary <command>!',
});
CLI.options({
  beginner: require('./easy.js'),
  intermediate: require('./medium.js'),
  expert: require('./hard.js'),
});

CLI.version(require('./package.json').version);

CLI.alias({
  k: 'k',
});

CLI.threshold({
  beginner: 1,
  intermediate: 2,
  expert: 3,
});

CLI.help('help');
CLI.hook({
  intermediate: () => require('./node_modules/webpack-command/lib/cli.js'),
  expert: () => require('webpack-cli'),
});
let results = CLI.run(process.argv.slice(2));

/* Example of chaining commands
if(results.argv.init) {
    require("@webpack-cli/init")();
    setTimeout(() => {
    process.argv = [...process.argv.slice(0, 2),"--config","./webpack.dev.js", "--port", "1337"];
    return require("./node_modules/webpack-serve/cli.js");
    }, 10E3 + 10E3)
}
*/

if (results.output) {
  console.log(results.output);
}
