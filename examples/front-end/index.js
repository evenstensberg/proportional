#!/usr/bin/env node
const Proportional = require('../../proportional');

const CLI = new Proportional();

CLI.levels(['react', 'angular', 'vue']);

CLI.defaultLevel('vue');

CLI.hook({
  react: () => require('./node_modules/.bin/create-react-app'),
  angular: () => require('./node_modules/.bin/ng'),
  vue: () => require('./node_modules/.bin/vue'),
});

CLI.run(process.argv.slice(2));
