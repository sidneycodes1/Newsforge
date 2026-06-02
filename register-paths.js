const Module = require('module');
const path = require('path');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@agent/')) {
    request = path.join(__dirname, 'agent', 'dist', request.slice(7));
  } else if (request.startsWith('@shared/')) {
    request = path.join(__dirname, 'shared', request.slice(8));
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
