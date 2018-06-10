#!/usr/bin/env node
const Proportional = require('../../proportional');

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
