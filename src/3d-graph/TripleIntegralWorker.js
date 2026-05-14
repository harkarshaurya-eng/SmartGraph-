/* global math */
importScripts("https://cdn.jsdelivr.net/npm/mathjs@13.2.0/lib/browser/math.js");

/**
 * Worker message handler for triple integration jobs.
 */
self.onmessage = (event) => {
  const { action, payload } = event.data || {};
  if (action !== "compute") {
    return;
  }

  try {
    const result = runTripleIntegral(payload);
    self.postMessage({ type: "done", result });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error.message || "Triple integration failed.",
    });
  }
};

/**
 * Compute the triple integral and Richardson-style error estimate.
 *
 * @param {object} payload - Integration input payload.
 * @returns {object}
 */
function runTripleIntegral(payload) {
  const compiledIntegrand = compile(payload.integrand, ["x", "y", "z"]);
  const compiledYMin = compile(payload.yMin, ["x"]);
  const compiledYMax = compile(payload.yMax, ["x"]);
  const compiledZMin = compile(payload.zMin, ["x", "y"]);
  const compiledZMax = compile(payload.zMax, ["x", "y"]);

  const xMin = evaluateConstant(payload.xMin);
  const xMax = evaluateConstant(payload.xMax);
  if (xMin >= xMax) {
    throw new Error("x_min must be smaller than x_max.");
  }

  const normalizedCounts = normalizeCounts(payload.nX, payload.nY, payload.nZ);
  const primaryValue = compositeSimpson3D(
    {
      compiledIntegrand,
      compiledYMin,
      compiledYMax,
      compiledZMin,
      compiledZMax,
      xMin,
      xMax,
      counts: normalizedCounts,
      progressLabel: "primary",
    },
    true
  );
  const halfCounts = {
    nX: Math.max(2, normalizedCounts.nX / 2),
    nY: Math.max(2, normalizedCounts.nY / 2),
    nZ: Math.max(2, normalizedCounts.nZ / 2),
  };
  const secondaryValue = compositeSimpson3D(
    {
      compiledIntegrand,
      compiledYMin,
      compiledYMax,
      compiledZMin,
      compiledZMax,
      xMin,
      xMax,
      counts: halfCounts,
      progressLabel: "estimate",
    },
    false
  );

  return {
    result: primaryValue,
    coarseResult: secondaryValue,
    errorEstimate: Math.abs(primaryValue - secondaryValue),
    counts: normalizedCounts,
    notices: normalizedCounts.notices,
  };
}

/**
 * Run nested composite Simpson integration across x, y(x), and z(x, y).
 *
 * @param {object} config - Integration configuration.
 * @param {boolean} reportProgress - Whether to emit progress updates.
 * @returns {number}
 */
function compositeSimpson3D(config, reportProgress) {
  const { compiledIntegrand, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xMin, xMax, counts } = config;
  const hx = (xMax - xMin) / counts.nX;
  let outerSum = 0;

  for (let ix = 0; ix <= counts.nX; ix += 1) {
    const x = xMin + hx * ix;
    const wx = simpsonWeight(ix, counts.nX);
    const yMin = evaluate(compiledYMin, { x });
    const yMax = evaluate(compiledYMax, { x });
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin > yMax) {
      throw new Error("The y bounds become invalid inside the chosen x interval.");
    }

    const hy = (yMax - yMin) / counts.nY;
    let middleSum = 0;

    for (let iy = 0; iy <= counts.nY; iy += 1) {
      const y = yMin + hy * iy;
      const wy = simpsonWeight(iy, counts.nY);
      const zMin = evaluate(compiledZMin, { x, y });
      const zMax = evaluate(compiledZMax, { x, y });
      if (!Number.isFinite(zMin) || !Number.isFinite(zMax) || zMin > zMax) {
        throw new Error("The z bounds become invalid inside the chosen x and y interval.");
      }

      const hz = (zMax - zMin) / counts.nZ;
      let innerSum = 0;

      for (let iz = 0; iz <= counts.nZ; iz += 1) {
        const z = zMin + hz * iz;
        const wz = simpsonWeight(iz, counts.nZ);
        const value = evaluate(compiledIntegrand, { x, y, z });
        if (!Number.isFinite(value)) {
          continue;
        }
        innerSum += wz * value;
      }

      middleSum += wy * (hz / 3) * innerSum;
    }

    outerSum += wx * (hy / 3) * middleSum;

    if (reportProgress) {
      self.postMessage({
        type: "progress",
        value: Math.round((ix / counts.nX) * 100),
      });
    }
  }

  return (hx / 3) * outerSum;
}

/**
 * Compile a math.js expression with allowed variables only.
 *
 * @param {string} expression - Expression string.
 * @param {string[]} variables - Allowed variable names.
 * @returns {{ evaluate: Function }}
 */
function compile(expression, variables) {
  const cleaned = String(expression ?? "").trim().replace(/\*\*/g, "^");
  if (!cleaned) {
    throw new Error("Please complete every triple-integral expression field.");
  }

  let node;
  try {
    node = math.parse(cleaned);
  } catch (error) {
    throw new Error(error.message || "Invalid expression.");
  }

  const symbols = node.filter((item) => item.isSymbolNode).map((item) => item.name);
  const invalidSymbols = symbols.filter((name) => !variables.includes(name) && !math[name] && !["pi", "e"].includes(name));
  if (invalidSymbols.length > 0) {
    throw new Error(`Unsupported variables in expression: ${invalidSymbols.join(", ")}`);
  }

  const compiled = node.compile();
  return {
    evaluate(scope) {
      return Number(
        compiled.evaluate({
          ...scope,
          pi: Math.PI,
          e: Math.E,
        })
      );
    },
  };
}

/**
 * Evaluate a compiled expression safely.
 *
 * @param {{ evaluate: Function }} compiled - Compiled expression.
 * @param {Record<string, number>} scope - Numeric scope.
 * @returns {number}
 */
function evaluate(compiled, scope) {
  const value = compiled.evaluate(scope);
  return Number.isFinite(value) ? value : Number.NaN;
}

/**
 * Evaluate a constant expression string.
 *
 * @param {string} expression - Constant expression.
 * @returns {number}
 */
function evaluateConstant(expression) {
  return evaluate(compile(expression, []), {});
}

/**
 * Return the composite Simpson weight for a given node.
 *
 * @param {number} index - Node index.
 * @param {number} totalIntervals - Total interval count.
 * @returns {number}
 */
function simpsonWeight(index, totalIntervals) {
  if (index === 0 || index === totalIntervals) {
    return 1;
  }
  return index % 2 === 0 ? 2 : 4;
}

/**
 * Normalize Simpson interval counts, ensuring even values.
 *
 * @param {number|string} nX - Requested x intervals.
 * @param {number|string} nY - Requested y intervals.
 * @param {number|string} nZ - Requested z intervals.
 * @returns {{ nX: number, nY: number, nZ: number, notices: string[] }}
 */
function normalizeCounts(nX, nY, nZ) {
  const notices = [];
  const values = {
    nX: normalizeEvenCount(Number(nX), "n_x", notices),
    nY: normalizeEvenCount(Number(nY), "n_y", notices),
    nZ: normalizeEvenCount(Number(nZ), "n_z", notices),
    notices,
  };
  return values;
}

/**
 * Clamp and even-normalize one Simpson interval count.
 *
 * @param {number} value - Requested value.
 * @param {string} label - Display label.
 * @param {string[]} notices - Notice list to append to.
 * @returns {number}
 */
function normalizeEvenCount(value, label, notices) {
  let safeValue = Math.max(2, Math.min(80, Math.round(value || 40)));
  if (safeValue % 2 !== 0) {
    safeValue += 1;
    notices.push(`${label} was increased to ${safeValue} because Simpson's rule needs an even number of intervals.`);
  }
  return safeValue;
}
