import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  evaluateExpression,
  formatNumber,
  computeStatistics,
  createMatrix,
  addMatrices,
  subtractMatrices,
  multiplyMatrices,
  determinant,
  inverse,
  formatMatrix
} from './utils/calculatorEngine.js';

const DEFAULT_WINDOW = Object.freeze({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
const DEFAULT_FUNCTIONS = Object.freeze([
  { id: 'Y₁', expression: 'sin(x)' },
  { id: 'Y₂', expression: '' },
  { id: 'Y₃', expression: '' },
  { id: 'Y₄', expression: '' },
  { id: 'Y₅', expression: '' },
  { id: 'Y₆', expression: '' }
]);

const KEYBOARD_LAYOUT = [
  [
    { id: 'second', primary: '2ND', type: 'command', action: 'toggleSecond' },
    { id: 'mode', primary: 'MODE', type: 'command', action: 'toggleAngle' },
    { id: 'del', primary: 'DEL', type: 'command', action: 'delete' },
    { id: 'alpha', primary: 'ALPHA', type: 'command', action: 'toggleAlpha' },
    { id: 'store', primary: 'STO→', type: 'command', action: 'store' }
  ],
  [
    { id: 'math', primary: 'MATH', type: 'command', action: 'openMatrix' },
    { id: 'apps', primary: 'APPS', type: 'command', action: 'openStats' },
    { id: 'prgm', primary: 'PRGM', type: 'command', action: 'openTable' },
    { id: 'vars', primary: 'VARS', type: 'command', action: 'openVars' },
    { id: 'clear', primary: 'CLEAR', type: 'command', action: 'clear' }
  ],
  [
    {
      id: 'x-var',
      primary: 'X,T,θ,n',
      type: 'input',
      primaryValue: 'x',
      secondaryValue: 't'
    },
    {
      id: 'sin',
      primary: 'sin',
      secondary: 'sin⁻¹',
      type: 'input',
      primaryValue: 'sin(',
      secondaryValue: 'asin('
    },
    {
      id: 'cos',
      primary: 'cos',
      secondary: 'cos⁻¹',
      type: 'input',
      primaryValue: 'cos(',
      secondaryValue: 'acos('
    },
    {
      id: 'tan',
      primary: 'tan',
      secondary: 'tan⁻¹',
      type: 'input',
      primaryValue: 'tan(',
      secondaryValue: 'atan('
    },
    {
      id: 'power',
      primary: '^',
      secondary: '√',
      type: 'input',
      primaryValue: '^',
      secondaryValue: '√('
    }
  ],
  [
    {
      id: 'log',
      primary: 'log',
      secondary: '10^',
      type: 'input',
      primaryValue: 'log(',
      secondaryValue: '10^('
    },
    {
      id: 'ln',
      primary: 'ln',
      secondary: 'e^',
      type: 'input',
      primaryValue: 'ln(',
      secondaryValue: 'exp('
    },
    { id: 'left-paren', primary: '(', type: 'input', primaryValue: '(' },
    { id: 'right-paren', primary: ')', type: 'input', primaryValue: ')' },
    { id: 'divide', primary: '÷', type: 'input', primaryValue: '÷' }
  ],
  [
    { id: 'seven', primary: '7', type: 'input', primaryValue: '7' },
    { id: 'eight', primary: '8', type: 'input', primaryValue: '8' },
    { id: 'nine', primary: '9', type: 'input', primaryValue: '9' },
    { id: 'multiply', primary: '×', type: 'input', primaryValue: '×' },
    {
      id: 'ncr',
      primary: 'nCr',
      secondary: 'nPr',
      type: 'input',
      primaryValue: 'nCr(',
      secondaryValue: 'nPr('
    }
  ],
  [
    { id: 'four', primary: '4', type: 'input', primaryValue: '4' },
    { id: 'five', primary: '5', type: 'input', primaryValue: '5' },
    { id: 'six', primary: '6', type: 'input', primaryValue: '6' },
    { id: 'minus', primary: '-', type: 'input', primaryValue: '-' },
    {
      id: 'pi',
      primary: 'π',
      secondary: 'e',
      type: 'input',
      primaryValue: 'π',
      secondaryValue: 'e'
    }
  ],
  [
    { id: 'one', primary: '1', type: 'input', primaryValue: '1' },
    { id: 'two', primary: '2', type: 'input', primaryValue: '2' },
    { id: 'three', primary: '3', type: 'input', primaryValue: '3' },
    { id: 'plus', primary: '+', type: 'input', primaryValue: '+' },
    { id: 'ans', primary: 'Ans', type: 'input', primaryValue: 'Ans' }
  ],
  [
    { id: 'zero', primary: '0', type: 'input', primaryValue: '0' },
    { id: 'decimal', primary: '.', type: 'input', primaryValue: '.' },
    { id: 'comma', primary: ',', type: 'input', primaryValue: ',' },
    { id: 'neg', primary: '(-)', type: 'command', action: 'negate' },
    { id: 'enter', primary: 'ENTER', type: 'command', action: 'enter' }
  ]
];

const VARIABLE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'T'];

function ModeStrip({ activeView, onAction }) {
  const buttons = [
    { label: 'Y=', action: 'graph' },
    { label: 'WINDOW', action: 'window' },
    { label: 'ZOOM', action: 'zoom' },
    { label: 'TRACE', action: 'table' },
    { label: 'GRAPH', action: 'graph' },
    { label: 'STAT', action: 'stats' },
    { label: 'MATRIX', action: 'matrix' }
  ];
  return (
    <nav className="mode-strip" aria-label="Primary modes">
      {buttons.map((button) => (
        <button
          key={`${button.action}-${button.label}`}
          type="button"
          className={`mode-strip__btn ${activeView === button.action ? 'mode-strip__btn--active' : ''}`}
          onClick={() => onAction(button.action)}
        >
          {button.label}
        </button>
      ))}
    </nav>
  );
}

function CalculatorDisplay({ expression, preview, error, angleMode, activeView }) {
  return (
    <header className="display">
      <div className="display__status">
        <span className="badge">{angleMode}</span>
        <span className="badge badge--view">{activeView.toUpperCase()}</span>
      </div>
      <div className="display__expression" aria-live="polite">
        {expression || '0'}
      </div>
      <div className={`display__result ${error ? 'display__result--error' : ''}`}>
        {error ? error : preview}
      </div>
    </header>
  );
}

function KeyButton({ config, onPress, secondActive, alphaActive, isPressed }) {
  const label = secondActive && config.secondary ? config.secondary : config.primary;
  const span = config.span || 1;
  const className = [
    'key',
    config.type === 'command' ? 'key--command' : 'key--input',
    secondActive && config.secondary ? 'key--secondary' : '',
    alphaActive && config.id === 'alpha' ? 'key--active' : '',
    isPressed ? 'key--pressed' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} style={{ gridColumn: span > 1 ? `span ${span}` : undefined }} onClick={() => onPress(config)}>
      {label}
    </button>
  );
}

function HistoryList({ history, onSelect }) {
  if (!history.length) {
    return (
      <div className="history history--empty">
        <p>No calculations yet. Results will appear here.</p>
      </div>
    );
  }
  return (
    <div className="history" aria-label="Previous calculations">
      {history.map((entry, index) => (
        <button
          type="button"
          className="history__item"
          key={`${entry.expression}-${index}`}
          onClick={() => onSelect(entry)}
        >
          <span className="history__expr">{entry.expression}</span>
          <span className="history__result">{formatNumber(entry.result)}</span>
        </button>
      ))}
    </div>
  );
}

function FunctionPalette({ onInsert }) {
  const palette = [
    { label: 'abs', value: 'abs(' },
    { label: 'cbrt', value: 'cbrt(' },
    { label: 'nthroot', value: 'nthroot(' },
    { label: 'sinh', value: 'sinh(' },
    { label: 'cosh', value: 'cosh(' },
    { label: 'tanh', value: 'tanh(' },
    { label: 'floor', value: 'floor(' },
    { label: 'ceil', value: 'ceil(' },
    { label: 'round', value: 'round(' }
  ];
  return (
    <div className="palette" role="group" aria-label="Advanced functions">
      {palette.map((fn) => (
        <button key={fn.label} type="button" className="palette__chip" onClick={() => onInsert(fn.value)}>
          {fn.label}
        </button>
      ))}
    </div>
  );
}

function GraphPanel({
  functions,
  onChangeFunction,
  settings,
  onChangeSettings,
  angleMode,
  variables,
  ans,
  panelRef
}) {
  const canvasRef = useRef(null);

  const evaluateForX = useCallback(
    (expression, x) => {
      if (!expression.trim()) return null;
      try {
        return evaluateExpression(expression, {
          angleMode,
          Ans: ans,
          variables: { ...variables, x, X: x, t: x, T: x }
        });
      } catch {
        return null;
      }
    },
    [angleMode, ans, variables]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { xMin, xMax, yMin, yMax } = settings;
    if (xMax === xMin || yMax === yMin) {
      return;
    }
    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);

    const toScreen = (x, y) => ({
      x: (x - xMin) * scaleX,
      y: height - (y - yMin) * scaleY
    });

    ctx.fillStyle = '#06101a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(115,243,255,0.2)';
    ctx.lineWidth = 1;
    const stepX = Math.max(1, Math.floor((xMax - xMin) / 10));
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx += stepX) {
      const { x } = toScreen(gx, 0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const stepY = Math.max(1, Math.floor((yMax - yMin) / 10));
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy += stepY) {
      const { y } = toScreen(0, gy);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const axisZero = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(115,243,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisZero.x, 0);
    ctx.lineTo(axisZero.x, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, axisZero.y);
    ctx.lineTo(width, axisZero.y);
    ctx.stroke();

    const colors = ['#73f3ff', '#f6a1ff', '#ffd166', '#90f0a0', '#f38ba8', '#a6e3a1'];
    functions.forEach((fn, index) => {
      if (!fn.expression.trim()) return;
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      const samples = Math.max(200, Math.floor(width));
      for (let i = 0; i <= samples; i += 1) {
        const x = xMin + (i / samples) * (xMax - xMin);
        const y = evaluateForX(fn.expression, x);
        if (y === null || !Number.isFinite(y)) {
          first = true;
          continue;
        }
        const { x: sx, y: sy } = toScreen(x, y);
        if (first) {
          ctx.moveTo(sx, sy);
          first = false;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    });
  }, [functions, settings, evaluateForX]);

  const updateSetting = (key, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    onChangeSettings((prev) => ({ ...prev, [key]: numeric }));
  };

  return (
    <section ref={panelRef} className="panel" aria-labelledby="graph-heading">
      <div className="panel__header">
        <h2 id="graph-heading">Graph</h2>
        <p>Plot up to six equations with configurable window settings.</p>
      </div>
      <div className="graph">
        <canvas ref={canvasRef} className="graph__canvas" role="img" aria-label="Graphing window" />
        <div className="graph__controls">
          <div className="graph__equations">
            {functions.map((fn) => (
              <label key={fn.id} className="graph__row">
                <span>{fn.id} =</span>
                <input
                  type="text"
                  value={fn.expression}
                  onChange={(event) =>
                    onChangeFunction(fn.id, event.target.value)
                  }
                  placeholder="sin(x)"
                />
              </label>
            ))}
          </div>
          <div className="graph__settings">
            <h3>Window</h3>
            <div className="graph__grid">
              <label>
                Xmin
                <input
                  type="number"
                  value={settings.xMin}
                  onChange={(event) => updateSetting('xMin', event.target.value)}
                />
              </label>
              <label>
                Xmax
                <input
                  type="number"
                  value={settings.xMax}
                  onChange={(event) => updateSetting('xMax', event.target.value)}
                />
              </label>
              <label>
                Ymin
                <input
                  type="number"
                  value={settings.yMin}
                  onChange={(event) => updateSetting('yMin', event.target.value)}
                />
              </label>
              <label>
                Ymax
                <input
                  type="number"
                  value={settings.yMax}
                  onChange={(event) => updateSetting('yMax', event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TablePanel({ functions, config, onChangeConfig, angleMode, variables, ans, panelRef }) {
  const activeFunction = functions[config.functionIndex] || functions[0];
  const rows = useMemo(() => {
    if (!activeFunction || !activeFunction.expression.trim()) return [];
    const data = [];
    for (let i = 0; i < config.rows; i += 1) {
      const x = config.start + i * config.step;
      try {
        const y = evaluateExpression(activeFunction.expression, {
          angleMode,
          Ans: ans,
          variables: { ...variables, x, X: x, t: x, T: x }
        });
        data.push({ x, y });
      } catch {
        data.push({ x, y: NaN });
      }
    }
    return data;
  }, [activeFunction, config, angleMode, variables, ans]);

  return (
    <section ref={panelRef} className="panel" aria-labelledby="table-heading">
      <div className="panel__header">
        <h2 id="table-heading">Table</h2>
        <p>Generate an X/Y table for the selected function.</p>
      </div>
      <div className="table">
        <div className="table__controls">
          <label>
            Function
            <select
              value={config.functionIndex}
              onChange={(event) =>
                onChangeConfig((prev) => ({
                  ...prev,
                  functionIndex: Number(event.target.value)
                }))
              }
            >
              {functions.map((fn, index) => (
                <option value={index} key={fn.id}>
                  {fn.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start X
            <input
              type="number"
              value={config.start}
              onChange={(event) =>
                onChangeConfig((prev) => ({ ...prev, start: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Step
            <input
              type="number"
              value={config.step}
              onChange={(event) =>
                onChangeConfig((prev) => ({ ...prev, step: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Rows
            <input
              type="number"
              min="1"
              max="20"
              value={config.rows}
              onChange={(event) =>
                onChangeConfig((prev) => ({ ...prev, rows: Number(event.target.value) }))
              }
            />
          </label>
        </div>
        <div className="table__grid" role="table">
          <div className="table__header" role="row">
            <span role="columnheader">X</span>
            <span role="columnheader">Y</span>
          </div>
          {rows.map((row, index) => (
            <div className="table__row" role="row" key={`${row.x}-${index}`}>
              <span role="cell">{formatNumber(row.x)}</span>
              <span role="cell">{Number.isFinite(row.y) ? formatNumber(row.y) : 'undef'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsPanel({ panelRef }) {
  const [listInput, setListInput] = useState('1,2,3,4,5');
  const values = useMemo(() => {
    const tokens = listInput
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map(Number)
      .filter((value) => Number.isFinite(value));
    return tokens;
  }, [listInput]);
  const stats = useMemo(() => computeStatistics(values), [values]);

  return (
    <section ref={panelRef} className="panel" aria-labelledby="stats-heading">
      <div className="panel__header">
        <h2 id="stats-heading">Statistics</h2>
        <p>Analyze lists with descriptive statistics.</p>
      </div>
      <div className="stats">
        <label className="stats__input">
          Data List
          <textarea
            value={listInput}
            onChange={(event) => setListInput(event.target.value)}
            rows={6}
          />
        </label>
        {stats ? (
          <dl className="stats__results">
            <div>
              <dt>Count</dt>
              <dd>{stats.count}</dd>
            </div>
            <div>
              <dt>Mean</dt>
              <dd>{formatNumber(stats.mean)}</dd>
            </div>
            <div>
              <dt>Median</dt>
              <dd>{formatNumber(stats.median)}</dd>
            </div>
            <div>
              <dt>Min</dt>
              <dd>{formatNumber(stats.min)}</dd>
            </div>
            <div>
              <dt>Max</dt>
              <dd>{formatNumber(stats.max)}</dd>
            </div>
            <div>
              <dt>Σx</dt>
              <dd>{formatNumber(stats.sum)}</dd>
            </div>
            <div>
              <dt>σ²</dt>
              <dd>{formatNumber(stats.variance)}</dd>
            </div>
            <div>
              <dt>σ</dt>
              <dd>{formatNumber(stats.stdDev)}</dd>
            </div>
            <div>
              <dt>s²</dt>
              <dd>{formatNumber(stats.sampleVariance)}</dd>
            </div>
            <div>
              <dt>s</dt>
              <dd>{formatNumber(stats.sampleStdDev)}</dd>
            </div>
          </dl>
        ) : (
          <p className="stats__empty">Enter at least one numeric value.</p>
        )}
      </div>
    </section>
  );
}

function MatrixInput({ title, rows, cols, values, onChange, idPrefix }) {
  return (
    <div className="matrix__section">
      <div className="matrix__header">
        <h3>{title}</h3>
        <div className="matrix__dimensions">
          <label>
            Rows
            <input
              type="number"
              min="1"
              max="4"
              value={rows}
              onChange={(event) => onChange('rows', Number(event.target.value))}
            />
          </label>
          <label>
            Cols
            <input
              type="number"
              min="1"
              max="4"
              value={cols}
              onChange={(event) => onChange('cols', Number(event.target.value))}
            />
          </label>
        </div>
      </div>
      <div className="matrix__grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(3rem, 1fr))` }}>
        {values.slice(0, rows).map((row, r) =>
          row.slice(0, cols).map((value, c) => (
            <input
              key={`${idPrefix}-${r}-${c}`}
              type="number"
              value={value}
              onChange={(event) => onChange('value', Number(event.target.value), r, c)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MatrixPanel({ panelRef }) {
  const [matrixA, setMatrixA] = useState({
    rows: 2,
    cols: 2,
    values: createMatrix(4, 4, 0)
  });
  const [matrixB, setMatrixB] = useState({
    rows: 2,
    cols: 2,
    values: createMatrix(4, 4, 0)
  });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const updateMatrix = (key, type, value, r, c) => {
    const setter = key === 'A' ? setMatrixA : setMatrixB;
    const state = key === 'A' ? matrixA : matrixB;
    if (type === 'rows') {
      setter((prev) => ({ ...prev, rows: Math.min(Math.max(1, value), 4) }));
    } else if (type === 'cols') {
      setter((prev) => ({ ...prev, cols: Math.min(Math.max(1, value), 4) }));
    } else if (type === 'value') {
      const nextValues = state.values.map((rowArr, rowIndex) =>
        rowArr.map((cell, colIndex) => {
          if (rowIndex === r && colIndex === c) return value;
          return cell;
        })
      );
      setter((prev) => ({ ...prev, values: nextValues }));
    }
  };

  const execute = (operation) => {
    setError('');
    try {
      const a = matrixA.values.slice(0, matrixA.rows).map((row) => row.slice(0, matrixA.cols));
      const b = matrixB.values.slice(0, matrixB.rows).map((row) => row.slice(0, matrixB.cols));
      let output;
      switch (operation) {
        case 'add':
          output = addMatrices(a, b);
          break;
        case 'subtract':
          output = subtractMatrices(a, b);
          break;
        case 'multiply':
          output = multiplyMatrices(a, b);
          break;
        case 'detA':
          output = [[determinant(a)]];
          break;
        case 'detB':
          output = [[determinant(b)]];
          break;
        case 'invA':
          output = inverse(a);
          break;
        case 'invB':
          output = inverse(b);
          break;
        default:
          output = [];
      }
      setResult(formatMatrix(output));
    } catch (err) {
      setResult('');
      setError(err.message);
    }
  };

  return (
    <section ref={panelRef} className="panel" aria-labelledby="matrix-heading">
      <div className="panel__header">
        <h2 id="matrix-heading">Matrix Operations</h2>
        <p>Work with matrices up to 4×4 and compute determinants or inverses.</p>
      </div>
      <div className="matrix">
        <MatrixInput
          title="Matrix A"
          rows={matrixA.rows}
          cols={matrixA.cols}
          values={matrixA.values}
          idPrefix="A"
          onChange={(type, value, r, c) => updateMatrix('A', type, value, r, c)}
        />
        <MatrixInput
          title="Matrix B"
          rows={matrixB.rows}
          cols={matrixB.cols}
          values={matrixB.values}
          idPrefix="B"
          onChange={(type, value, r, c) => updateMatrix('B', type, value, r, c)}
        />
        <div className="matrix__actions">
          <button type="button" onClick={() => execute('add')}>
            A + B
          </button>
          <button type="button" onClick={() => execute('subtract')}>
            A − B
          </button>
          <button type="button" onClick={() => execute('multiply')}>
            A × B
          </button>
          <button type="button" onClick={() => execute('detA')}>
            det(A)
          </button>
          <button type="button" onClick={() => execute('detB')}>
            det(B)
          </button>
          <button type="button" onClick={() => execute('invA')}>
            A⁻¹
          </button>
          <button type="button" onClick={() => execute('invB')}>
            B⁻¹
          </button>
        </div>
        <div className="matrix__output">
          <h3>Result</h3>
          {error ? <p className="matrix__error">{error}</p> : <pre>{result || '—'}</pre>}
        </div>
      </div>
    </section>
  );
}

function VariablesPanel({ variables, onInsert, awaitingStore, onStore, alphaActive }) {
  return (
    <div className="variables" role="group" aria-label="Variables">
      {VARIABLE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={`variables__key ${awaitingStore ? 'variables__key--store' : ''}`}
          onClick={() => (awaitingStore ? onStore(key) : onInsert(key))}
        >
          <span>{key}</span>
          <small>{formatNumber(variables[key] ?? 0)}</small>
        </button>
      ))}
      {alphaActive && <p className="variables__hint">Alpha lock: insert variables directly.</p>}
    </div>
  );
}

export default function App() {
  const calculatorRef = useRef(null);
  const graphRef = useRef(null);
  const tableRef = useRef(null);
  const statsRef = useRef(null);
  const matrixRef = useRef(null);
  const [expression, setExpression] = useState('');
  const [ans, setAns] = useState(0);
  const [angleMode, setAngleMode] = useState('RAD');
  const [history, setHistory] = useState([]);
  const [secondActive, setSecondActive] = useState(false);
  const [alphaActive, setAlphaActive] = useState(false);
  const [storeAwaiting, setStoreAwaiting] = useState(false);
  const [variables, setVariables] = useState(
    VARIABLE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );
  const [activeView, setActiveView] = useState('graph');
  const [graphFunctions, setGraphFunctions] = useState(() => DEFAULT_FUNCTIONS.map((fn) => ({ ...fn })));
  const [graphSettings, setGraphSettings] = useState(() => ({ ...DEFAULT_WINDOW }));
  const [tableConfig, setTableConfig] = useState({ functionIndex: 0, start: -5, step: 1, rows: 10 });

  const evaluation = useMemo(() => {
    try {
      const value = evaluateExpression(expression, {
        angleMode,
        Ans: ans,
        variables
      });
      return { value, formatted: formatNumber(value), error: null };
    } catch (error) {
      return { value: null, formatted: 'Error', error: error.message };
    }
  }, [expression, angleMode, ans, variables]);

  const insertValue = useCallback(
    (value) => {
      setExpression((prev) => `${prev}${value}`);
      setSecondActive(false);
      setAlphaActive(false);
      setStoreAwaiting(false);
    },
    []
  );

  const handleStore = useCallback(
    (target) => {
      const valueToStore = evaluation.error ? ans : evaluation.value;
      setVariables((prev) => ({ ...prev, [target]: valueToStore }));
      setStoreAwaiting(false);
      setAlphaActive(false);
    },
    [evaluation, ans]
  );

  const handleHistorySelect = useCallback((entry) => {
    setExpression(entry.expression);
  }, []);

  const handleQuickAction = useCallback(
    (action) => {
      const scrollTo = (ref) => {
        ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      switch (action) {
        case 'graph':
          setActiveView('graph');
          scrollTo(graphRef);
          break;
        case 'table':
          setActiveView('table');
          scrollTo(tableRef);
          break;
        case 'stats':
          setActiveView('stats');
          scrollTo(statsRef);
          break;
        case 'matrix':
          setActiveView('matrix');
          scrollTo(matrixRef);
          break;
        case 'window':
          setActiveView('graph');
          scrollTo(graphRef);
          setGraphSettings({ ...DEFAULT_WINDOW });
          break;
        case 'zoom':
          setActiveView('graph');
          scrollTo(graphRef);
          setGraphSettings((prev) => {
            const spanX = prev.xMax - prev.xMin;
            const spanY = prev.yMax - prev.yMin;
            if (spanX <= 2 || spanY <= 2) {
              return { ...DEFAULT_WINDOW };
            }
            const centerX = (prev.xMax + prev.xMin) / 2;
            const centerY = (prev.yMax + prev.yMin) / 2;
            const nextSpanX = spanX * 0.5;
            const nextSpanY = spanY * 0.5;
            return {
              xMin: centerX - nextSpanX / 2,
              xMax: centerX + nextSpanX / 2,
              yMin: centerY - nextSpanY / 2,
              yMax: centerY + nextSpanY / 2
            };
          });
          break;
        default:
          break;
      }
    },
    [graphRef, tableRef, statsRef, matrixRef, setGraphSettings]
  );

  const handleKeyPress = useCallback(
    (config) => {
      if (config.type === 'input') {
        const value = secondActive && config.secondaryValue ? config.secondaryValue : config.primaryValue;
        insertValue(value);
        return;
      }
      switch (config.action) {
        case 'toggleSecond':
          setSecondActive((prev) => !prev);
          break;
        case 'toggleAngle':
          setAngleMode((prev) => (prev === 'RAD' ? 'DEG' : 'RAD'));
          setSecondActive(false);
          break;
        case 'delete':
          setExpression((prev) => prev.slice(0, -1));
          setSecondActive(false);
          break;
        case 'toggleAlpha':
          setAlphaActive((prev) => !prev);
          setSecondActive(false);
          break;
        case 'store':
          setStoreAwaiting(true);
          setSecondActive(false);
          break;
        case 'clear':
          setExpression('');
          setStoreAwaiting(false);
          setSecondActive(false);
          break;
        case 'openMatrix':
          handleQuickAction('matrix');
          setSecondActive(false);
          break;
        case 'openStats':
          handleQuickAction('stats');
          setSecondActive(false);
          break;
        case 'openTable':
          handleQuickAction('table');
          setSecondActive(false);
          break;
        case 'openVars':
          setActiveView('calculate');
          calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setSecondActive(false);
          break;
        case 'negate':
          insertValue('-');
          break;
        case 'enter': {
          if (evaluation.error) return;
          setAns(evaluation.value);
          setHistory((prev) => [{ expression, result: evaluation.value }, ...prev].slice(0, 12));
          setExpression('');
          setSecondActive(false);
          setStoreAwaiting(false);
          setAlphaActive(false);
          break;
        }
        default:
          break;
      }
    },
    [insertValue, evaluation, expression, secondActive, handleQuickAction, calculatorRef]
  );

  const changeGraphFunction = useCallback((id, value) => {
    setGraphFunctions((prev) => prev.map((fn) => (fn.id === id ? { ...fn, expression: value } : fn)));
  }, []);

  const insertVariable = useCallback(
    (key) => {
      insertValue(key);
    },
    [insertValue]
  );

  return (
    <div className="app">
      <CalculatorDisplay
        expression={expression}
        preview={evaluation.formatted}
        error={evaluation.error}
        angleMode={angleMode}
        activeView={activeView}
      />
      <ModeStrip activeView={activeView} onAction={handleQuickAction} />
      <main className="workspace">
        <div className="calculator" ref={calculatorRef}>
          <FunctionPalette onInsert={insertValue} />
          <VariablesPanel
            variables={variables}
            onInsert={insertVariable}
            awaitingStore={storeAwaiting}
            onStore={handleStore}
            alphaActive={alphaActive}
          />
          <div className="keypad" role="grid">
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
              <div className="keypad__row" role="row" key={rowIndex}>
                {row.map((key) => (
                  <KeyButton
                    key={key.id}
                    config={key}
                    onPress={handleKeyPress}
                    secondActive={secondActive}
                    alphaActive={alphaActive}
                    isPressed={false}
                  />
                ))}
              </div>
            ))}
          </div>
          <HistoryList history={history} onSelect={handleHistorySelect} />
        </div>
        <div className="panels">
          <GraphPanel
            functions={graphFunctions}
            onChangeFunction={changeGraphFunction}
            settings={graphSettings}
            onChangeSettings={setGraphSettings}
            angleMode={angleMode}
            variables={variables}
            ans={ans}
            panelRef={graphRef}
          />
          <TablePanel
            functions={graphFunctions}
            config={tableConfig}
            onChangeConfig={setTableConfig}
            angleMode={angleMode}
            variables={variables}
            ans={ans}
            panelRef={tableRef}
          />
          <StatsPanel panelRef={statsRef} />
          <MatrixPanel panelRef={matrixRef} />
        </div>
      </main>
    </div>
  );
}
