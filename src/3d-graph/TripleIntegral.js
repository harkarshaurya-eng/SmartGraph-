import { THREE } from "./ThreeDGraph.js";
import { createShadeGroup, recolorShadeGroup } from "./ShadeTool.js";
import { colorFromValue } from "./DrawTool.js";

/**
 * Triple-integral UI, worker orchestration, and 3D visualization controller.
 */
export class TripleIntegralController {
  /**
   * @param {object} options - Controller options.
   * @param {import("./ThreeDGraph.js").ThreeDGraph} options.graph - Graph controller.
   * @param {import("./ExpressionParser.js").ExpressionParser} options.parser - Expression parser.
   * @param {import("./ObjectManager.js").ObjectManager} options.objectManager - Scene object manager.
   * @param {HTMLElement} options.root - Integral panel root.
   * @param {HTMLElement} options.noticeElement - Error/notice element.
   * @param {HTMLElement} options.outputElement - Result output box.
   * @param {HTMLProgressElement} options.progressElement - Progress bar.
   */
  constructor(options) {
    this.graph = options.graph;
    this.parser = options.parser;
    this.objectManager = options.objectManager;
    this.root = options.root;
    this.noticeElement = options.noticeElement;
    this.outputElement = options.outputElement;
    this.progressElement = options.progressElement;
    this.worker = null;
    this.currentRegionId = null;
    this.sliceObjects = [];
    this.sliceAnimationTimer = null;

    this.bindEvents();
    this.renderPresetButtons();
  }

  /**
   * Attach button handlers.
   */
  bindEvents() {
    this.root.querySelector("#triple-integral-run").addEventListener("click", () => this.compute());
    this.root.querySelector("#triple-integral-animate").addEventListener("click", () => this.animateSlices());
    this.root.querySelector("#triple-integral-clear").addEventListener("click", () => this.clearVisuals());
  }

  /**
   * Render the preset-integral buttons.
   */
  renderPresetButtons() {
    const presetsContainer = this.root.querySelector("#triple-integral-presets");
    presetsContainer.innerHTML = "";
    this.parser.getTripleIntegralPresets().forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-button";
      button.textContent = preset.name;
      button.addEventListener("click", () => this.loadPreset(preset.fields));
      presetsContainer.appendChild(button);
    });
  }

  /**
   * Load a preset into the form.
   *
   * @param {Record<string, string>} fields - Field values to load.
   */
  loadPreset(fields) {
    Object.entries(fields).forEach(([key, value]) => {
      const input = this.root.querySelector(`[data-field="${key}"]`);
      if (input) {
        input.value = value;
      }
    });
    this.setNotice("Preset loaded.");
  }

  /**
   * Launch a worker-based Simpson integration run.
   */
  compute() {
    try {
      const payload = this.readPayload();
      this.progressElement.value = 0;
      this.outputElement.textContent = "Computing triple integral...";
      this.setNotice("Running composite Simpson's rule in a worker.");

      if (this.worker) {
        this.worker.terminate();
      }
      this.worker = new Worker("./TripleIntegralWorker.js");
      this.worker.onmessage = (event) => this.handleWorkerMessage(event.data, payload);
      this.worker.postMessage({ action: "compute", payload });
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * React to worker progress and completion messages.
   *
   * @param {object} message - Worker message.
   * @param {object} payload - Original job payload.
   */
  handleWorkerMessage(message, payload) {
    if (message.type === "progress") {
      this.progressElement.value = message.value;
      return;
    }

    if (message.type === "error") {
      this.progressElement.value = 0;
      this.setNotice(message.message, true);
      this.outputElement.textContent = message.message;
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      return;
    }

    if (message.type === "done") {
      this.progressElement.value = 100;
      this.renderResult(message.result);
      this.visualizeRegion(payload);
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }
  }

  /**
   * Show the numeric result and notices.
   *
   * @param {{ result: number, coarseResult: number, errorEstimate: number, counts: object, notices: string[] }} result - Worker result.
   */
  renderResult(result) {
    const lines = [
      "Triple Integral Result",
      "",
      `Approximation: ${Number(result.result).toPrecision(8)}`,
      `Coarser grid: ${Number(result.coarseResult).toPrecision(8)}`,
      `Estimated error: ${Number(result.errorEstimate).toPrecision(4)}`,
      "",
      `Intervals used: n_x=${result.counts.nX}, n_y=${result.counts.nY}, n_z=${result.counts.nZ}`,
    ];
    if (result.notices.length > 0) {
      lines.push("", "Notices:");
      result.notices.forEach((notice) => lines.push(`- ${notice}`));
    }
    this.outputElement.textContent = lines.join("\n");
    this.setNotice("Triple integration complete.");
  }

  /**
   * Build and add a 3D visualization of the integration region.
   *
   * @param {object} payload - Original job input.
   */
  visualizeRegion(payload) {
    this.clearVisuals();

    const compiledIntegrand = this.parser.compile(payload.integrand, ["x", "y", "z"]);
    const compiledYMin = this.parser.compile(payload.yMin, ["x"]);
    const compiledYMax = this.parser.compile(payload.yMax, ["x"]);
    const compiledZMin = this.parser.compile(payload.zMin, ["x", "y"]);
    const compiledZMax = this.parser.compile(payload.zMax, ["x", "y"]);

    const counts = {
      nX: this.parser.normalizeEvenStepCount(payload.nX).value,
      nY: this.parser.normalizeEvenStepCount(payload.nY).value,
      nZ: this.parser.normalizeEvenStepCount(payload.nZ).value,
    };
    const xMin = Number(payload.xMin);
    const xMax = Number(payload.xMax);

    const geometry = buildTripleRegionGeometry(this.parser, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xMin, xMax, counts);
    const regionColor = this.root.querySelector("#triple-region-color").value || "#22c55e";
    const regionOpacity = clamp(Number(this.root.querySelector("#triple-region-opacity").value || 0.35), 0.1, 0.9);
    const wireframe = this.root.querySelector("#triple-region-wireframe").checked;

    const group = createShadeGroup(geometry, regionColor, regionOpacity, wireframe);
    const { id } = this.objectManager.add("Triple Region", group, (nextColor) => recolorShadeGroup(group, nextColor));
    this.currentRegionId = id;

    this.sliceObjects = buildSlicePlanes(
      this.parser,
      compiledIntegrand,
      compiledYMin,
      compiledYMax,
      compiledZMin,
      compiledZMax,
      xMin,
      xMax,
      counts
    );
    this.graph.setTransientObjects(this.sliceObjects);
  }

  /**
   * Animate the generated slice planes.
   */
  animateSlices() {
    if (this.sliceObjects.length === 0) {
      this.setNotice("Run a triple integral first to generate slices.", true);
      return;
    }

    if (this.sliceAnimationTimer) {
      window.clearInterval(this.sliceAnimationTimer);
    }

    let index = 0;
    this.sliceObjects.forEach((slice, sliceIndex) => {
      slice.visible = sliceIndex === 0;
    });

    this.sliceAnimationTimer = window.setInterval(() => {
      this.sliceObjects.forEach((slice, sliceIndex) => {
        slice.visible = sliceIndex === index;
      });
      index = (index + 1) % this.sliceObjects.length;
    }, 220);

    this.setNotice("Slice animation started.");
  }

  /**
   * Remove existing region and slice visuals.
   */
  clearVisuals() {
    if (this.currentRegionId) {
      this.objectManager.delete(this.currentRegionId);
      this.currentRegionId = null;
    }
    if (this.sliceAnimationTimer) {
      window.clearInterval(this.sliceAnimationTimer);
      this.sliceAnimationTimer = null;
    }
    this.graph.setTransientObjects([]);
    this.sliceObjects = [];
  }

  /**
   * Read the current integral form values.
   *
   * @returns {object}
   */
  readPayload() {
    const payload = {
      integrand: this.root.querySelector('[data-field="integrand"]').value,
      xMin: this.root.querySelector('[data-field="xMin"]').value,
      xMax: this.root.querySelector('[data-field="xMax"]').value,
      yMin: this.root.querySelector('[data-field="yMin"]').value,
      yMax: this.root.querySelector('[data-field="yMax"]').value,
      zMin: this.root.querySelector('[data-field="zMin"]').value,
      zMax: this.root.querySelector('[data-field="zMax"]').value,
      nX: this.root.querySelector('[data-field="nX"]').value,
      nY: this.root.querySelector('[data-field="nY"]').value,
      nZ: this.root.querySelector('[data-field="nZ"]').value,
    };

    if (!payload.integrand.trim()) {
      throw new Error("Please enter an integrand for the triple integral.");
    }

    return payload;
  }

  /**
   * Show a short status message.
   *
   * @param {string} message - Feedback message.
   * @param {boolean} [isError=false] - Whether the message is an error.
   */
  setNotice(message, isError = false) {
    this.noticeElement.textContent = message;
    this.noticeElement.dataset.error = isError ? "true" : "false";
  }
}

/**
 * Build a closed region mesh for nested bounds x, y(x), and z(x, y).
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Parser instance.
 * @param {{ evaluate: Function }} compiledYMin - Lower y bound.
 * @param {{ evaluate: Function }} compiledYMax - Upper y bound.
 * @param {{ evaluate: Function }} compiledZMin - Lower z bound.
 * @param {{ evaluate: Function }} compiledZMax - Upper z bound.
 * @param {number} xMin - Outer x minimum.
 * @param {number} xMax - Outer x maximum.
 * @param {{ nX: number, nY: number, nZ: number }} counts - Sample counts.
 * @returns {THREE.BufferGeometry}
 */
export function buildTripleRegionGeometry(parser, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xMin, xMax, counts) {
  const xSamples = Array.from({ length: counts.nX + 1 }, (_, index) => xMin + ((xMax - xMin) * index) / counts.nX);
  const topRows = [];
  const bottomRows = [];
  const yRows = [];
  const positions = [];

  xSamples.forEach((xValue) => {
    const yMin = parser.evaluate(compiledYMin, { x: xValue });
    const yMax = parser.evaluate(compiledYMax, { x: xValue });
    const ySamples = Array.from({ length: counts.nY + 1 }, (_, index) => yMin + ((yMax - yMin) * index) / counts.nY);
    yRows.push(ySamples);

    const topRow = [];
    const bottomRow = [];
    ySamples.forEach((yValue) => {
      const zMin = parser.evaluate(compiledZMin, { x: xValue, y: yValue });
      const zMax = parser.evaluate(compiledZMax, { x: xValue, y: yValue });
      topRow.push(zMax);
      bottomRow.push(zMin);
    });
    topRows.push(topRow);
    bottomRows.push(bottomRow);
  });

  for (let ix = 0; ix < counts.nX; ix += 1) {
    for (let iy = 0; iy < counts.nY; iy += 1) {
      const p00 = [xSamples[ix], yRows[ix][iy], topRows[ix][iy]];
      const p10 = [xSamples[ix + 1], yRows[ix + 1][iy], topRows[ix + 1][iy]];
      const p11 = [xSamples[ix + 1], yRows[ix + 1][iy + 1], topRows[ix + 1][iy + 1]];
      const p01 = [xSamples[ix], yRows[ix][iy + 1], topRows[ix][iy + 1]];
      positions.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);

      const q00 = [xSamples[ix], yRows[ix][iy], bottomRows[ix][iy]];
      const q10 = [xSamples[ix + 1], yRows[ix + 1][iy], bottomRows[ix + 1][iy]];
      const q11 = [xSamples[ix + 1], yRows[ix + 1][iy + 1], bottomRows[ix + 1][iy + 1]];
      const q01 = [xSamples[ix], yRows[ix][iy + 1], bottomRows[ix][iy + 1]];
      positions.push(...q00, ...q11, ...q10, ...q00, ...q01, ...q11);
    }
  }

  addTripleRegionWalls(positions, xSamples, yRows, topRows, bottomRows, counts);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Build translucent z-slices of the integrand over the 3D region.
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Parser instance.
 * @param {{ evaluate: Function }} compiledIntegrand - Compiled integrand.
 * @param {{ evaluate: Function }} compiledYMin - Lower y bound.
 * @param {{ evaluate: Function }} compiledYMax - Upper y bound.
 * @param {{ evaluate: Function }} compiledZMin - Lower z bound.
 * @param {{ evaluate: Function }} compiledZMax - Upper z bound.
 * @param {number} xMin - Outer x minimum.
 * @param {number} xMax - Outer x maximum.
 * @param {{ nX: number, nY: number, nZ: number }} counts - Sample counts.
 * @returns {THREE.Mesh[]}
 */
export function buildSlicePlanes(parser, compiledIntegrand, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xMin, xMax, counts) {
  const xSamples = Array.from({ length: Math.min(18, counts.nX) + 1 }, (_, index) => xMin + ((xMax - xMin) * index) / Math.min(18, counts.nX));
  const zRange = sampleGlobalZRange(parser, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xSamples, Math.min(18, counts.nY));
  const sliceCount = 10;
  const slices = [];
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  const slicePatches = [];

  for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex += 1) {
    const zLevel = zRange.min + ((zRange.max - zRange.min) * sliceIndex) / Math.max(sliceCount - 1, 1);
    const patches = [];

    for (let ix = 0; ix < xSamples.length - 1; ix += 1) {
      const x1 = xSamples[ix];
      const x2 = xSamples[ix + 1];
      const yMin1 = parser.evaluate(compiledYMin, { x: x1 });
      const yMax1 = parser.evaluate(compiledYMax, { x: x1 });
      const yMin2 = parser.evaluate(compiledYMin, { x: x2 });
      const yMax2 = parser.evaluate(compiledYMax, { x: x2 });
      const yDivisions = Math.min(16, counts.nY);

      for (let iy = 0; iy < yDivisions; iy += 1) {
        const y1 = yMin1 + ((yMax1 - yMin1) * iy) / yDivisions;
        const y2 = yMin1 + ((yMax1 - yMin1) * (iy + 1)) / yDivisions;
        const y3 = yMin2 + ((yMax2 - yMin2) * (iy + 1)) / yDivisions;
        const y4 = yMin2 + ((yMax2 - yMin2) * iy) / yDivisions;

        const inRegion =
          zLevel >= parser.evaluate(compiledZMin, { x: x1, y: y1 }) &&
          zLevel <= parser.evaluate(compiledZMax, { x: x1, y: y1 }) &&
          zLevel >= parser.evaluate(compiledZMin, { x: x2, y: y3 }) &&
          zLevel <= parser.evaluate(compiledZMax, { x: x2, y: y3 });

        if (!inRegion) {
          continue;
        }

        const sampleValue = parser.evaluate(compiledIntegrand, { x: (x1 + x2) / 2, y: (y1 + y3) / 2, z: zLevel });
        if (!Number.isFinite(sampleValue)) {
          continue;
        }

        minValue = Math.min(minValue, sampleValue);
        maxValue = Math.max(maxValue, sampleValue);
        patches.push({
          polygon: [
            [x1, y1, zLevel],
            [x1, y2, zLevel],
            [x2, y3, zLevel],
            [x2, y4, zLevel],
          ],
          value: sampleValue,
        });
      }
    }

    slicePatches.push(patches);
  }

  slicePatches.forEach((patches, sliceIndex) => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    patches.forEach((patch) => {
      const color = colorFromValue(patch.value, minValue, maxValue);
      const [p1, p2, p3, p4] = patch.polygon;
      positions.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);
      for (let repeat = 0; repeat < 6; repeat += 1) {
        colors.push(color.r, color.g, color.b);
      }
    });
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
    );
    mesh.visible = sliceIndex === 0;
    slices.push(mesh);
  });

  return slices;
}

/**
 * Add side walls and x-end caps to the triple-integral region.
 *
 * @param {number[]} positions - Position buffer.
 * @param {number[]} xSamples - Sampled x values.
 * @param {number[][]} yRows - Sampled y rows.
 * @param {number[][]} topRows - Top z rows.
 * @param {number[][]} bottomRows - Bottom z rows.
 * @param {{ nX: number, nY: number }} counts - Sample counts.
 */
function addTripleRegionWalls(positions, xSamples, yRows, topRows, bottomRows, counts) {
  const addQuad = (a, b, c, d) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };

  for (let ix = 0; ix < counts.nX; ix += 1) {
    const lowerStart = [xSamples[ix], yRows[ix][0], topRows[ix][0]];
    const lowerEnd = [xSamples[ix + 1], yRows[ix + 1][0], topRows[ix + 1][0]];
    const lowerEndBottom = [xSamples[ix + 1], yRows[ix + 1][0], bottomRows[ix + 1][0]];
    const lowerStartBottom = [xSamples[ix], yRows[ix][0], bottomRows[ix][0]];
    addQuad(lowerStart, lowerEnd, lowerEndBottom, lowerStartBottom);

    const upperStart = [xSamples[ix], yRows[ix][counts.nY], topRows[ix][counts.nY]];
    const upperEnd = [xSamples[ix + 1], yRows[ix + 1][counts.nY], topRows[ix + 1][counts.nY]];
    const upperEndBottom = [xSamples[ix + 1], yRows[ix + 1][counts.nY], bottomRows[ix + 1][counts.nY]];
    const upperStartBottom = [xSamples[ix], yRows[ix][counts.nY], bottomRows[ix][counts.nY]];
    addQuad(upperStart, upperStartBottom, upperEndBottom, upperEnd);
  }

  for (let iy = 0; iy < counts.nY; iy += 1) {
    const startTop1 = [xSamples[0], yRows[0][iy], topRows[0][iy]];
    const startTop2 = [xSamples[0], yRows[0][iy + 1], topRows[0][iy + 1]];
    const startBottom2 = [xSamples[0], yRows[0][iy + 1], bottomRows[0][iy + 1]];
    const startBottom1 = [xSamples[0], yRows[0][iy], bottomRows[0][iy]];
    addQuad(startTop1, startBottom1, startBottom2, startTop2);

    const endTop1 = [xSamples[counts.nX], yRows[counts.nX][iy], topRows[counts.nX][iy]];
    const endTop2 = [xSamples[counts.nX], yRows[counts.nX][iy + 1], topRows[counts.nX][iy + 1]];
    const endBottom2 = [xSamples[counts.nX], yRows[counts.nX][iy + 1], bottomRows[counts.nX][iy + 1]];
    const endBottom1 = [xSamples[counts.nX], yRows[counts.nX][iy], bottomRows[counts.nX][iy]];
    addQuad(endTop1, endTop2, endBottom2, endBottom1);
  }
}

/**
 * Estimate the global z range across the sampled region.
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Parser instance.
 * @param {{ evaluate: Function }} compiledYMin - Lower y bound.
 * @param {{ evaluate: Function }} compiledYMax - Upper y bound.
 * @param {{ evaluate: Function }} compiledZMin - Lower z bound.
 * @param {{ evaluate: Function }} compiledZMax - Upper z bound.
 * @param {number[]} xSamples - X samples.
 * @param {number} yDivisions - Number of y samples per x.
 * @returns {{ min: number, max: number }}
 */
function sampleGlobalZRange(parser, compiledYMin, compiledYMax, compiledZMin, compiledZMax, xSamples, yDivisions) {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  xSamples.forEach((xValue) => {
    const yMin = parser.evaluate(compiledYMin, { x: xValue });
    const yMax = parser.evaluate(compiledYMax, { x: xValue });
    for (let index = 0; index <= yDivisions; index += 1) {
      const yValue = yMin + ((yMax - yMin) * index) / yDivisions;
      minimum = Math.min(minimum, parser.evaluate(compiledZMin, { x: xValue, y: yValue }));
      maximum = Math.max(maximum, parser.evaluate(compiledZMax, { x: xValue, y: yValue }));
    }
  });
  return { min: minimum, max: maximum };
}

/**
 * Clamp a numeric value.
 *
 * @param {number} value - Input value.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
