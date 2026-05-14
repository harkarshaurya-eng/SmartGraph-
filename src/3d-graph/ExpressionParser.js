import * as math from "https://cdn.jsdelivr.net/npm/mathjs@13.2.0/+esm";

/**
 * Safe math.js wrapper for SmartGraph's 3D tools.
 */
export class ExpressionParser {
  /**
   * Create a parser with a reusable empty scope.
   */
  constructor() {
    this.baseScope = Object.freeze({
      pi: Math.PI,
      e: Math.E,
    });
  }

  /**
   * Compile a user expression without using eval().
   *
   * @param {string} expression - User-provided math expression.
   * @param {string[]} variables - Allowed variable names.
   * @returns {{ evaluate: (scope: Record<string, number>) => number, text: string }}
   */
  compile(expression, variables = []) {
    const cleaned = this.normalizeExpression(expression);
    if (!cleaned) {
      throw new Error("Please enter an expression.");
    }

    let node;
    try {
      node = math.parse(cleaned);
    } catch (error) {
      throw new Error(error.message || "Invalid expression.");
    }

    const symbolNames = Array.from(new Set(node.filter((item) => item.isSymbolNode).map((item) => item.name)));
    const invalidSymbols = symbolNames.filter(
      (name) => !variables.includes(name) && !Object.prototype.hasOwnProperty.call(this.baseScope, name) && !math[name]
    );

    if (invalidSymbols.length > 0) {
      throw new Error(`Unsupported variables: ${invalidSymbols.join(", ")}`);
    }

    const compiled = node.compile();
    return {
      text: cleaned,
      evaluate: (scope = {}) => {
        const safeScope = { ...this.baseScope };
        for (const variableName of variables) {
          if (Object.prototype.hasOwnProperty.call(scope, variableName)) {
            safeScope[variableName] = scope[variableName];
          }
        }
        const value = compiled.evaluate(safeScope);
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(numeric)) {
          return Number.NaN;
        }
        return numeric;
      },
    };
  }

  /**
   * Replace UI-friendly power syntax and trim whitespace.
   *
   * @param {string} expression - Raw expression.
   * @returns {string}
   */
  normalizeExpression(expression) {
    return String(expression ?? "").trim().replace(/\*\*/g, "^");
  }

  /**
   * Evaluate a compiled expression safely.
   *
   * @param {{ evaluate: (scope: Record<string, number>) => number }} compiled - Compiled expression.
   * @param {Record<string, number>} scope - Numeric scope values.
   * @returns {number}
   */
  evaluate(compiled, scope) {
    try {
      return compiled.evaluate(scope);
    } catch {
      return Number.NaN;
    }
  }

  /**
   * Parse a coordinate triple string into numbers.
   *
   * @param {string} text - Coordinate string such as "1, 2, 3".
   * @returns {[number, number, number]}
   */
  parseTriplet(text) {
    const parts = String(text ?? "")
      .split(",")
      .map((part) => Number(part.trim()));
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
      throw new Error("Please enter exactly three numeric values.");
    }
    return [parts[0], parts[1], parts[2]];
  }

  /**
   * Parse a multiline or semicolon-separated list of 3D points.
   *
   * @param {string} text - Vertex list input.
   * @returns {Array<[number, number, number]>}
   */
  parsePointList(text) {
    const rows = String(text ?? "")
      .split(/[\n;]+/)
      .map((row) => row.trim())
      .filter(Boolean);
    if (rows.length === 0) {
      throw new Error("Please enter at least one point.");
    }
    return rows.map((row) => this.parseTriplet(row));
  }

  /**
   * Clamp step counts and make Simpson-compatible interval counts even.
   *
   * @param {number} value - Requested interval count.
   * @param {number} maximum - Maximum allowed interval count.
   * @returns {{ value: number, adjusted: boolean }}
   */
  normalizeEvenStepCount(value, maximum = 80) {
    const integerValue = Math.max(2, Math.min(maximum, Math.round(Number(value) || 2)));
    if (integerValue % 2 === 0) {
      return { value: integerValue, adjusted: false };
    }
    return { value: Math.min(integerValue + 1, maximum), adjusted: true };
  }

  /**
   * Built-in triple integral examples.
   *
   * @returns {Array<{ name: string, fields: Record<string, string> }>}
   */
  getTripleIntegralPresets() {
    return [
      {
        name: "Unit Sphere",
        fields: {
          integrand: "1",
          xMin: "-1",
          xMax: "1",
          yMin: "-sqrt(1 - x^2)",
          yMax: "sqrt(1 - x^2)",
          zMin: "-sqrt(1 - x^2 - y^2)",
          zMax: "sqrt(1 - x^2 - y^2)",
          nX: "40",
          nY: "40",
          nZ: "40",
        },
      },
      {
        name: "xyz on Unit Cube",
        fields: {
          integrand: "x * y * z",
          xMin: "0",
          xMax: "1",
          yMin: "0",
          yMax: "1",
          zMin: "0",
          zMax: "1",
          nX: "40",
          nY: "40",
          nZ: "40",
        },
      },
      {
        name: "Gaussian Box",
        fields: {
          integrand: "exp(-(x^2 + y^2 + z^2))",
          xMin: "-2",
          xMax: "2",
          yMin: "-2",
          yMax: "2",
          zMin: "-2",
          zMax: "2",
          nX: "36",
          nY: "36",
          nZ: "36",
        },
      },
      {
        name: "Cylinder Energy",
        fields: {
          integrand: "x^2 + y^2 + z^2",
          xMin: "-1",
          xMax: "1",
          yMin: "-sqrt(1 - x^2)",
          yMax: "sqrt(1 - x^2)",
          zMin: "0",
          zMax: "2",
          nX: "40",
          nY: "40",
          nZ: "40",
        },
      },
    ];
  }
}

export { math };
