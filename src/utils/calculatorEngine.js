const OP_INFO = {
  '+': { precedence: 2, assoc: 'L', args: 2, fn: (a, b) => a + b },
  '-': { precedence: 2, assoc: 'L', args: 2, fn: (a, b) => a - b },
  'neg': { precedence: 5, assoc: 'R', args: 1, fn: (a) => -a },
  '*': { precedence: 3, assoc: 'L', args: 2, fn: (a, b) => a * b },
  '/': { precedence: 3, assoc: 'L', args: 2, fn: (a, b) => a / b },
  '^': { precedence: 4, assoc: 'R', args: 2, fn: (a, b) => a ** b },
  '!': {
    precedence: 6,
    assoc: 'L',
    args: 1,
    fn: (a) => {
      if (!Number.isFinite(a)) throw new Error('Non-finite factorial');
      if (Math.abs(a - Math.round(a)) > 1e-9 || a < 0) throw new Error('Factorial defined for non-negative integers');
      let result = 1;
      for (let i = 2; i <= Math.round(a); i += 1) {
        result *= i;
      }
      return result;
    }
  }
};

const FUNCTION_INFO = {
  sin: { args: 1, fn: (a, mode) => Math.sin(toRadiansIfNeeded(a, mode)) },
  cos: { args: 1, fn: (a, mode) => Math.cos(toRadiansIfNeeded(a, mode)) },
  tan: { args: 1, fn: (a, mode) => Math.tan(toRadiansIfNeeded(a, mode)) },
  asin: { args: 1, fn: (a, mode) => fromRadiansIfNeeded(Math.asin(a), mode) },
  acos: { args: 1, fn: (a, mode) => fromRadiansIfNeeded(Math.acos(a), mode) },
  atan: { args: 1, fn: (a, mode) => fromRadiansIfNeeded(Math.atan(a), mode) },
  sinh: { args: 1, fn: (a) => Math.sinh(a) },
  cosh: { args: 1, fn: (a) => Math.cosh(a) },
  tanh: { args: 1, fn: (a) => Math.tanh(a) },
  asinh: { args: 1, fn: (a) => Math.asinh(a) },
  acosh: { args: 1, fn: (a) => Math.acosh(a) },
  atanh: { args: 1, fn: (a) => Math.atanh(a) },
  ln: { args: 1, fn: (a) => Math.log(a) },
  log: { args: 1, fn: (a) => Math.log10(a) },
  sqrt: { args: 1, fn: (a) => Math.sqrt(a) },
  cbrt: { args: 1, fn: (a) => Math.cbrt(a) },
  abs: { args: 1, fn: (a) => Math.abs(a) },
  exp: { args: 1, fn: (a) => Math.exp(a) },
  floor: { args: 1, fn: (a) => Math.floor(a) },
  ceil: { args: 1, fn: (a) => Math.ceil(a) },
  round: { args: 1, fn: (a) => Math.round(a) },
  sign: { args: 1, fn: (a) => Math.sign(a) },
  nPr: {
    args: 2,
    fn: (n, r) => {
      if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
        throw new Error('nPr defined for integers with n ≥ r ≥ 0');
      }
      return factorial(n) / factorial(n - r);
    }
  },
  nCr: {
    args: 2,
    fn: (n, r) => {
      if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
        throw new Error('nCr defined for integers with n ≥ r ≥ 0');
      }
      return factorial(n) / (factorial(r) * factorial(n - r));
    }
  },
  nthroot: { args: 2, fn: (radicand, n) => Math.sign(radicand) * Math.abs(radicand) ** (1 / n) },
  deg: { args: 1, fn: (value) => (value * 180) / Math.PI },
  rad: { args: 1, fn: (value) => (value * Math.PI) / 180 }
};

const CONSTANT_ALIASES = {
  π: 'pi',
  PI: 'pi',
  Pi: 'pi',
  e: 'e',
  E: 'e'
};

function toRadiansIfNeeded(value, mode) {
  return mode === 'DEG' ? (value * Math.PI) / 180 : value;
}

function fromRadiansIfNeeded(value, mode) {
  return mode === 'DEG' ? (value * 180) / Math.PI : value;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('Factorial defined for non-negative integers');
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

function isIdentifierChar(char) {
  return /[A-Za-z_µθΩαβγδπΠσΣτφΦχψωΩ0-9]/.test(char);
}

function isDigit(char) {
  return /[0-9]/.test(char);
}

function pushImplicitMultiplication(tokens, nextToken) {
  if (tokens.length === 0) return false;
  const prev = tokens[tokens.length - 1];
  if (
    prev.type === 'number' ||
    prev.type === 'constant' ||
    prev.type === 'variable' ||
    prev.type === 'closing' ||
    (prev.type === 'operator' && prev.value === '!')
  ) {
    tokens.push({ type: 'operator', value: '*', info: OP_INFO['*'] });
    tokens.push(nextToken);
    return true;
  }
  return false;
}

export function tokenize(expression) {
  const tokens = [];
  const sanitized = expression.replace(/\s+/g, '');
  let i = 0;
  while (i < sanitized.length) {
    const char = sanitized[i];

    if (char === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i += 1;
      continue;
    }

    if (char === '(') {
      const token = { type: 'opening', value: '(' };
      if (!pushImplicitMultiplication(tokens, token)) {
        tokens.push(token);
      }
      i += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'closing', value: ')' });
      i += 1;
      continue;
    }

    if (char === '√') {
      const handled = pushImplicitMultiplication(tokens, { type: 'function', value: 'sqrt', info: FUNCTION_INFO.sqrt });
      if (!handled) tokens.push({ type: 'function', value: 'sqrt', info: FUNCTION_INFO.sqrt });
      i += 1;
      continue;
    }

    if (char === '÷') {
      tokens.push({ type: 'operator', value: '/', info: OP_INFO['/'] });
      i += 1;
      continue;
    }

    if (char === '×') {
      tokens.push({ type: 'operator', value: '*', info: OP_INFO['*'] });
      i += 1;
      continue;
    }

    if (char === '!') {
      tokens.push({ type: 'operator', value: '!', info: OP_INFO['!'] });
      i += 1;
      continue;
    }

    if ('+-*/^'.includes(char)) {
      tokens.push({ type: 'operator', value: char, info: OP_INFO[char] });
      i += 1;
      continue;
    }

    if (isDigit(char) || (char === '.' && isDigit(sanitized[i + 1]))) {
      let number = char;
      i += 1;
      while (i < sanitized.length && (isDigit(sanitized[i]) || sanitized[i] === '.')) {
        number += sanitized[i];
        i += 1;
      }
      const value = Number(number);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number: ${number}`);
      }
      tokens.push({ type: 'number', value });
      continue;
    }

    if (isIdentifierChar(char)) {
      let ident = char;
      i += 1;
      while (i < sanitized.length && isIdentifierChar(sanitized[i])) {
        ident += sanitized[i];
        i += 1;
      }
      if (CONSTANT_ALIASES[ident]) ident = CONSTANT_ALIASES[ident];
      const lower = ident.toLowerCase();
      if (FUNCTION_INFO[lower]) {
        const token = { type: 'function', value: lower, info: FUNCTION_INFO[lower] };
        if (!pushImplicitMultiplication(tokens, token)) {
          tokens.push(token);
        }
      } else if (lower === 'ans') {
        tokens.push({ type: 'variable', value: 'Ans' });
      } else if (lower === 'pi') {
        const token = { type: 'constant', value: Math.PI };
        if (!pushImplicitMultiplication(tokens, token)) {
          tokens.push(token);
        }
      } else if (lower === 'e') {
        const token = { type: 'constant', value: Math.E };
        if (!pushImplicitMultiplication(tokens, token)) {
          tokens.push(token);
        }
      } else {
        const token = { type: 'variable', value: ident };
        if (!pushImplicitMultiplication(tokens, token)) {
          tokens.push(token);
        }
      }
      continue;
    }

    throw new Error(`Unrecognized token: ${char}`);
  }

  return tokens;
}

function shuntingYard(tokens) {
  const output = [];
  const stack = [];
  let previous = null;

  tokens.forEach((token) => {
    switch (token.type) {
      case 'number':
      case 'constant':
      case 'variable':
        output.push(token);
        break;
      case 'function':
        stack.push(token);
        break;
      case 'comma': {
        while (stack.length && stack[stack.length - 1].type !== 'opening') {
          output.push(stack.pop());
        }
        if (!stack.length) {
          throw new Error('Misplaced comma or mismatched parentheses');
        }
        break;
      }
      case 'operator': {
        let current = token;
        if (token.value === '-' && (!previous || ['operator', 'opening', 'comma'].includes(previous.type))) {
          current = { type: 'operator', value: 'neg', info: OP_INFO.neg };
        }
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type === 'function') {
            output.push(stack.pop());
            continue;
          }
          if (top.type !== 'operator') break;
          if (
            (current.info.assoc === 'L' && current.info.precedence <= top.info.precedence) ||
            (current.info.assoc === 'R' && current.info.precedence < top.info.precedence)
          ) {
            output.push(stack.pop());
          } else {
            break;
          }
        }
        stack.push(current);
        break;
      }
      case 'opening':
        stack.push(token);
        break;
      case 'closing': {
        let foundOpening = false;
        while (stack.length) {
          const top = stack.pop();
          if (top.type === 'opening') {
            foundOpening = true;
            break;
          }
          output.push(top);
        }
        if (!foundOpening) {
          throw new Error('Mismatched parentheses');
        }
        if (stack.length && stack[stack.length - 1].type === 'function') {
          output.push(stack.pop());
        }
        break;
      }
      default:
        throw new Error(`Unhandled token type: ${token.type}`);
    }
    if (token.type !== 'comma') {
      previous = token;
    }
  });

  while (stack.length) {
    const top = stack.pop();
    if (top.type === 'opening' || top.type === 'closing') {
      throw new Error('Mismatched parentheses');
    }
    output.push(top);
  }

  return output;
}

function evaluateRPN(tokens, context) {
  const stack = [];
  tokens.forEach((token) => {
    if (token.type === 'number') {
      stack.push(token.value);
      return;
    }
    if (token.type === 'constant') {
      stack.push(token.value);
      return;
    }
    if (token.type === 'variable') {
      const value = context.variables?.[token.value];
      if (value === undefined) {
        throw new Error(`Unknown variable: ${token.value}`);
      }
      stack.push(value);
      return;
    }
    if (token.type === 'operator') {
      const info = token.info;
      if (!info) throw new Error(`Operator info missing for ${token.value}`);
      const args = [];
      for (let i = 0; i < info.args; i += 1) {
        if (!stack.length) throw new Error('Insufficient operands');
        args.unshift(stack.pop());
      }
      const result = info.fn(...args);
      stack.push(result);
      return;
    }
    if (token.type === 'function') {
      const { info } = token;
      const args = [];
      for (let i = 0; i < info.args; i += 1) {
        if (!stack.length) throw new Error('Insufficient operands');
        args.unshift(stack.pop());
      }
      const result = info.fn(...args, context.angleMode);
      stack.push(result);
      return;
    }
  });

  if (stack.length !== 1) {
    throw new Error('Invalid expression');
  }
  return stack[0];
}

export function evaluateExpression(expression, context = {}) {
  if (!expression || expression.trim() === '') {
    return context.Ans ?? 0;
  }
  const workingContext = {
    angleMode: context.angleMode || 'RAD',
    variables: {
      Ans: context.Ans ?? 0,
      pi: Math.PI,
      π: Math.PI,
      e: Math.E,
      ...context.variables
    }
  };

  const tokens = tokenize(expression);
  const rpn = shuntingYard(tokens);
  const value = evaluateRPN(rpn, workingContext);
  return value;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) >= 1e9 || Math.abs(value) <= 1e-4) {
    return value.toExponential(6);
  }
  const rounded = Math.round(value * 1e10) / 1e10;
  return rounded.toString();
}

export function computeStatistics(list) {
  if (!Array.isArray(list) || !list.length) {
    return null;
  }
  const sorted = [...list].sort((a, b) => a - b);
  const sum = list.reduce((acc, value) => acc + value, 0);
  const mean = sum / list.length;
  const median = list.length % 2 === 0
    ? (sorted[list.length / 2 - 1] + sorted[list.length / 2]) / 2
    : sorted[Math.floor(list.length / 2)];
  const variance = list.reduce((acc, value) => acc + (value - mean) ** 2, 0) / list.length;
  const sampleVariance = list.length > 1
    ? list.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (list.length - 1)
    : 0;
  return {
    count: list.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    sum,
    mean,
    median,
    variance,
    sampleVariance,
    stdDev: Math.sqrt(variance),
    sampleStdDev: Math.sqrt(sampleVariance)
  };
}

export function createMatrix(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function addMatrices(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error('Matrices must have the same dimensions');
  }
  return a.map((row, r) => row.map((value, c) => value + b[r][c]));
}

export function subtractMatrices(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error('Matrices must have the same dimensions');
  }
  return a.map((row, r) => row.map((value, c) => value - b[r][c]));
}

export function multiplyMatrices(a, b) {
  if (a[0].length !== b.length) {
    throw new Error('Columns of A must match rows of B');
  }
  const result = createMatrix(a.length, b[0].length, 0);
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < b[0].length; c += 1) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k += 1) {
        sum += a[r][k] * b[k][c];
      }
      result[r][c] = sum;
    }
  }
  return result;
}

export function determinant(matrix) {
  if (matrix.length !== matrix[0].length) {
    throw new Error('Determinant defined for square matrices');
  }
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  let det = 0;
  for (let c = 0; c < n; c += 1) {
    const minor = matrix.slice(1).map((row) => row.filter((_, index) => index !== c));
    det += ((c % 2 === 0 ? 1 : -1) * matrix[0][c] * determinant(minor));
  }
  return det;
}

export function inverse(matrix) {
  if (matrix.length !== matrix[0].length) {
    throw new Error('Inverse defined for square matrices');
  }
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row.map((value) => value),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let col = 0; col < n; col += 1) {
    let pivotRow = col;
    for (let row = col; row < n; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][col]) < 1e-12) {
      throw new Error('Matrix is singular');
    }
    if (pivotRow !== col) {
      const temp = augmented[pivotRow];
      augmented[pivotRow] = augmented[col];
      augmented[col] = temp;
    }
    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * n; j += 1) {
      augmented[col][j] /= pivot;
    }
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j += 1) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

export function formatMatrix(matrix) {
  return matrix.map((row) => row.map((value) => formatNumber(value)).join('\t')).join('\n');
}
