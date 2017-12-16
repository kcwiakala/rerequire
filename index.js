
const path = require('path');

function move(obj) {
  const moved = {};
  for(let key in obj) {
    moved[key] = obj[key];
    delete obj[key];
  }
  return moved;
}

function deepClean(moduleName) {
  const original = move(require.cache);
  require(moduleName);
  const dependencies = move(require.cache);

  for(let key in original) {
    if(!key in dependencies) {
      require.cache[key] = original[key];
    }
  }
}

function shallowClean(moduleName) {
  moduleName = require.resolve(moduleName);
  const root = require.cache[moduleName];

  let dependencies = [];
  let stack = [moduleName];

  while(stack.length > 0) {
    const v = stack.pop();
    dependencies.push(v);
    let m = require.cache[v];
    for(i in m.children) {
      stack.push(m.children[i].filename);
    }
  }
  
  for(let i in dependencies) {
    delete require.cache[dependencies[i]];
  }

  if(root.parent) {
    for(let i in root.parent.children) {
      if(root.parent.children[i] === root) {
        root.parent.children.splice(i,1);
      }
    }
  }
}

function callerPath() {
  const prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  const stack = err.stack;
  Error.prepareStackTrace = prepareStackTrace;
  return (stack.length > 1) ? stack[1].getFileName() : '.';
};

function rerequire(moduleName, deep) {
  moduleName = path.join(path.dirname(callerPath()), moduleName);
  if (deep !== false) {
    deepClean(moduleName);
  } else if (require.resolve(moduleName) in require.cache) {
    shallowClean(moduleName);
  }
  return require(moduleName);
}

module.exports = rerequire;