{ rm -rf node_modules; rm -rf package-lock.json; npm cache clean --force;npm cache clear --force; npm cache verify;npm install --save @types/node;npm install; npm run predeploy; npm run deploy;
  }
