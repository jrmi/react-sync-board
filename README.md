# npm-simple-library-template

Library template for both node and browser

[![npm version](https://badge.fury.io/js/%40riversun%2Fnpm-simple-library.svg)](https://badge.fury.io/js/%40riversun%2Fnpm-simple-library) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://circleci.com/gh/riversun/npm-simple-library.svg?style=shield)](https://circleci.com/gh/riversun/npm-simple-library)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bd35641c855b4556afc1076c294f110d)](https://app.codacy.com/manual/riversun/npm-simple-library?utm_source=github.com&utm_medium=referral&utm_content=riversun/npm-simple-library&utm_campaign=Badge_Grade_Dashboard)
[![Coverage Status](https://coveralls.io/repos/github/riversun/npm-simple-library/badge.svg)](https://coveralls.io/github/riversun/npm-simple-library)

## Quick start

```
npm install
npm start
```

## Project features

### 1.**Code as ES6 and build as ES5 (etc.) using webpack4 and babel7**

### 2.Code check with ESLint

Perform eslint based on airbnb style on build.


- Realtime check using webpack-dev-server

```
npm start
```

- Check code style when building 

```
npm run build
```

### 3.**Test with Jest**

**Run unit tests**

```
npm test
```

**Check test coverage**

```
npm run test:coverage
```

# How to run scripts

- install dependency packages

```
npm install
```

- run example on web browser

```
npm start
```

- run example on Node.js

```
npm run start:node
```

- build library as development mode

```
npm run build
```

- build library as production mode

```
npm run release
```

- run tests

```
npm test
```

- run tests with coverage

```
npm test:coverage
```

# How to handle library

## How webpack builds code as a library.

- Please see [this article (english)](https://dev.to/riversun/recipes-on-how-to-create-a-library-that-supports-both-browser-and-node-js-201m).

## Publish as a npm package

```
npm publish --access=public
```

## Use library

### Use on browser

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Use library directly with &lt;script&gt; tag</title>
</head>
<body>
<h3>Use library directly with &lt;script&gt; tag</h3>
<script src="https://cdn.jsdelivr.net/npm/@riversun/npm-simple-library@1.0.0/lib/computer.js"></script>
<script>

  //replace console.log with document.write to make the behavior visible
  console.log = (m) => {
    document.write(`<div style=" font-family: monospace;">${m}</div><br>`);
  };

  const computer = new Computer();

  console.log(`1 + 2 = ${computer.add(1, 2)}`);
  console.log(`1 - 2 = ${computer.sub(1, 2)}`);

</script>
</body>
</html>

```

### Use on node

```javascript
const Computer = require('@riversun/npm-simple-library');

const computer = new Computer();

console.log(`1 + 2 = ${computer.add(1, 2)}`);
console.log(`1 - 2 = ${computer.sub(1, 2)}`);
```

# Installed modules

- install babel for transpiling ES6 source code into ES5 etc. 

```
npm install --save-dev @babel/core @babel/preset-env babel-loader
```

- install jest for unit testing

```
npm install --save-dev jest babel-jest
```

- install cross-env for environment variables on both linux and windows

```
npm install --save-dev cross-env
```

- install webpack

```
npm install --save-dev terser-webpack-plugin webpack webpack-cli webpack-dev-server
```

- install eslint for code quality

```
npm install --save-dev eslint eslint-loader
```

- install babel-eslint

Since eslint does not support ES6 as it is, for example, error like `error  Parsing error: The keyword 'import' is reserved` may occur.
**babel-eslint** properly do **eslint** even es6 syntax.

```
npm install --save-dev babel-eslint
```

- install coding rules

If you want to apply an external coding guide like airbnb.

(**npx** is a tool for executing local Node packages included in npm.)

```
npx install-peerdeps --dev eslint-config-airbnb-base
```

# Appendix

## Using Webstorm

How to change Webstorm code formatter configuration to match ESLint.

### Change "Indent" for ESLint's "indent"

●**Settings of Webstorm**

Go **Settings > Editor > Code Style > JavaScript > Tabs and Indents Tab**

- Uncheck **Use tab character**
- Set Tab size,Indent,Continuation indent to **2**

![image](https://user-images.githubusercontent.com/11747460/76207315-e3f2f180-6240-11ea-8cd3-a3906f6ca0d3.png)


●**Typical lint error message**  

```
Expected indentation of 2 spaces but found 4
```


### Change "Before Parentheses" for ESLint's " space-before-function-paren"

●**Expected code style**

**bad**

```
function test ()
```

**good**

```
function test()
```


●**Settings of Webstorm**

Go **Settings > Editor > Code Style > JavaScript > Spaces Tab**

- Uncheck **Before Parentheses/In function expression**


![image](https://user-images.githubusercontent.com/11747460/76206591-a772c600-623f-11ea-8006-a3249351784a.png)


●**Typical lint error message**  

```
Unexpected space before function parentheses
```

### Change "Object literal braces","ES6 import/export braces" for ESLint's " object-curly-spacing"

●**Expected code style**

**bad**

```
export {default} from './my-computer';
```

**good**

```
export { default } from './my-computer';
```

●**Settings of Webstorm**

Go **Settings > Editor > Code Style > JavaScript > Spaces Tab**

- Check **Object literal braces**
- Check **ES6 import/export braces**


![image](https://user-images.githubusercontent.com/11747460/76206627-b6f20f00-623f-11ea-97ba-9bc63e08467f.png)


●**Typical lint error message**

```  
A space is required after '{'  
A space is required after '}'
```

### Change "Line separator" for ESLint's "linebreak-style"

●**Expected code style**

**bad**  
linebreak with CRLF

**good**  
linebreak with LF


●**Settings of Webstorm**

Go **Settings > Editor > Code Style > General Tab**

- Select **Unix and macOS(\n)** as **Line seperator**:

![image](https://user-images.githubusercontent.com/11747460/76206809-046e7c00-6240-11ea-9236-f9516988f2e2.png)

●**Typical lint error message**

```  
Expected linebreaks to be 'LF' but found 'CRLF'
```

### Enable Webstorm's **ESLint support**

●**Settings of Webstorm**

Go **Languages&Frameworks > JavaScript > Code Quality Tools > ESLint

- Check **Automatic ESLint configuration**

![image](https://user-images.githubusercontent.com/11747460/76211345-58ca2980-6249-11ea-8d29-410af84ff882.png)
