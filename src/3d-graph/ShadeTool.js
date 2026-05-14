import { THREE } from "./ThreeDGraph.js";
import { marchingCubes } from "./MarchingCubes.js";
import {
  buildPlanarPolygonObject,
  buildSurfaceGeometry,
  colorFromValue,
  computeSurfaceNormalGrid,
  liftPointToPlane,
  projectPolygonToPlane,
  sampleParametricCurve,
} from "./DrawTool.js";

/**
 * Shade-tool controller for bounded areas and volumes.
 */
export class ShadeTool {
  /**
   * @param {object} options - Tool options.
   * @param {import("./ThreeDGraph.js").ThreeDGraph} options.graph - Main scene graph.
   * @param {import("./ExpressionParser.js").ExpressionParser} options.parser - Safe parser.
   * @param {import("./ObjectManager.js").ObjectManager} options.objectManager - Scene object manager.
   * @param {HTMLElement} options.root - Shade tool root element.
   * @param {HTMLElement} options.noticeElement - Status element.
   */
  constructor(options) {
    this.graph = options.graph;
    this.parser = options.parser;
    this.objectManager = options.objectManager;
    this.root = options.root;
    this.noticeElement = options.noticeElement;

    this.bindEvents();
  }

  /**
   * Wire up all shade-mode buttons.
   */
  bindEvents() {
    this.root.querySelector("#shade-between-button").addEventListener("click", () => this.shadeBetweenSurfaces());
    this.root.querySelector("#shade-volume-button").addEventListener("click", () => this.shadeVolume());
    this.root.querySelector("#shade-curtain-button").addEventListener("click", () => this.shadeCurtain());
    this.root.querySelector("#shade-polygon-button").addEventListener("click", () => this.shadePolygon());
  }

  /**
   * Shade the region between z = f(x, y) and z = g(x, y).
   */
  shadeBetweenSurfaces() {
    try {
      const fCompiled = this.parser.compile(this.root.querySelector("#shade-f").value, ["x", "y"]);
      const gCompiled = this.parser.compile(this.root.querySelector("#shade-g").value, ["x", "y"]);
      const config = {
        xMin: Number(this.root.querySelector("#shade-surface-x-min").value),
        xMax: Number(this.root.querySelector("#shade-surface-x-max").value),
        xSteps: Math.max(4, Math.min(120, Math.round(Number(this.root.querySelector("#shade-surface-x-steps").value || 30)))),
        yMin: Number(this.root.querySelector("#shade-surface-y-min").value),
        yMax: Number(this.root.querySelector("#shade-surface-y-max").value),
        ySteps: Math.max(4, Math.min(120, Math.round(Number(this.root.querySelector("#shade-surface-y-steps").value || 30)))),
      };
      const color = this.root.querySelector("#shade-between-color").value || "#f59e0b";
      const opacity = clamp(Number(this.root.querySelector("#shade-opacity").value || 0.4), 0.1, 0.9);
      const wireframe = this.root.querySelector("#shade-wireframe").checked;

      const geometry = buildClosedSurfaceGapGeometry(this.parser, fCompiled, gCompiled, config);
      const group = createShadeGroup(geometry, color, opacity, wireframe);
      this.objectManager.add("Shaded Region", group, (nextColor) => recolorShadeGroup(group, nextColor));
      this.setNotice("Region between surfaces shaded.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Shade a volume defined by F(x, y, z) <= 0.
   */
  shadeVolume() {
    try {
      const compiled = this.parser.compile(this.root.querySelector("#shade-volume-expression").value, ["x", "y", "z"]);
      const bounds = {
        xMin: Number(this.root.querySelector("#shade-volume-x-min").value),
        xMax: Number(this.root.querySelector("#shade-volume-x-max").value),
        yMin: Number(this.root.querySelector("#shade-volume-y-min").value),
        yMax: Number(this.root.querySelector("#shade-volume-y-max").value),
        zMin: Number(this.root.querySelector("#shade-volume-z-min").value),
        zMax: Number(this.root.querySelector("#shade-volume-z-max").value),
      };
      const resolution = Math.max(16, Math.min(50, Math.round(Number(this.root.querySelector("#shade-volume-resolution").value || 30))));
      const color = this.root.querySelector("#shade-volume-color").value || "#38bdf8";
      const opacity = clamp(Number(this.root.querySelector("#shade-opacity").value || 0.4), 0.1, 0.9);
      const wireframe = this.root.querySelector("#shade-wireframe").checked;

      const { mesh } = marchingCubes((x, y, z) => this.parser.evaluate(compiled, { x, y, z }), resolution, bounds, {
        color,
        opacity,
        wireframe,
      });

      const group = new THREE.Group();
      group.add(mesh);
      this.objectManager.add("Shaded Volume", group, (nextColor) => recolorShadeGroup(group, nextColor));
      this.setNotice("Inequality volume shaded.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Shade a curtain under a parametric 3D curve.
   */
  shadeCurtain() {
    try {
      const compiledX = this.parser.compile(this.root.querySelector("#curtain-x").value, ["t"]);
      const compiledY = this.parser.compile(this.root.querySelector("#curtain-y").value, ["t"]);
      const compiledZ = this.parser.compile(this.root.querySelector("#curtain-z").value, ["t"]);
      const tMin = Number(this.root.querySelector("#curtain-t-min").value);
      const tMax = Number(this.root.querySelector("#curtain-t-max").value);
      const steps = Math.max(10, Math.min(1200, Math.round(Number(this.root.querySelector("#curtain-steps").value || 200))));
      const baseline = Number(this.root.querySelector("#curtain-baseline").value || 0);
      const color = this.root.querySelector("#curtain-color").value || "#8b5cf6";
      const opacity = clamp(Number(this.root.querySelector("#shade-opacity").value || 0.4), 0.1, 0.9);
      const wireframe = this.root.querySelector("#shade-wireframe").checked;

      const segments = sampleParametricCurve(this.parser, compiledX, compiledY, compiledZ, tMin, tMax, steps);
      if (segments.length === 0) {
        throw new Error("The curve could not be sampled for the selected t range.");
      }

      const group = new THREE.Group();
      segments.forEach((segment) => {
        const geometry = buildCurtainGeometry(segment, baseline);
        group.add(...createShadeGroup(geometry, color, opacity, wireframe).children);
      });

      this.objectManager.add("Curtain", group, (nextColor) => recolorShadeGroup(group, nextColor));
      this.setNotice("Curtain surface shaded.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Shade a planar polygonal region.
   */
  shadePolygon() {
    try {
      const points = this.parser.parsePointList(this.root.querySelector("#shade-polygon-vertices").value);
      const color = this.root.querySelector("#shade-polygon-color").value || "#10b981";
      const opacity = clamp(Number(this.root.querySelector("#shade-opacity").value || 0.4), 0.1, 0.9);
      const group = buildPlanarPolygonObject(points, color, darkenHex(color, 0.55), opacity);
      this.objectManager.add("Shaded Polygon", group, (nextColor) => recolorShadeGroup(group, nextColor));
      this.setNotice("Polygon region shaded.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Show a shade-tool notice.
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
 * Build a closed mesh between two sampled surfaces.
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Expression parser.
 * @param {{ evaluate: Function }} fCompiled - Top function.
 * @param {{ evaluate: Function }} gCompiled - Bottom function.
 * @param {{ xMin: number, xMax: number, xSteps: number, yMin: number, yMax: number, ySteps: number }} config - Sample configuration.
 * @returns {THREE.BufferGeometry}
 */
export function buildClosedSurfaceGapGeometry(parser, fCompiled, gCompiled, config) {
  const xSamples = Array.from({ length: config.xSteps + 1 }, (_, index) => config.xMin + ((config.xMax - config.xMin) * index) / config.xSteps);
  const ySamples = Array.from({ length: config.ySteps + 1 }, (_, index) => config.yMin + ((config.yMax - config.yMin) * index) / config.ySteps);
  const topGrid = [];
  const bottomGrid = [];

  for (let yIndex = 0; yIndex <= config.ySteps; yIndex += 1) {
    const topRow = [];
    const bottomRow = [];
    for (let xIndex = 0; xIndex <= config.xSteps; xIndex += 1) {
      const scope = { x: xSamples[xIndex], y: ySamples[yIndex] };
      const fValue = parser.evaluate(fCompiled, scope);
      const gValue = parser.evaluate(gCompiled, scope);
      if (!Number.isFinite(fValue) || !Number.isFinite(gValue)) {
        topRow.push(Number.NaN);
        bottomRow.push(Number.NaN);
        continue;
      }
      topRow.push(Math.max(fValue, gValue));
      bottomRow.push(Math.min(fValue, gValue));
    }
    topGrid.push(topRow);
    bottomGrid.push(bottomRow);
  }

  const positions = [];
  const topNormals = computeSurfaceNormalGrid(topGrid, xSamples, ySamples);
  const bottomNormals = computeSurfaceNormalGrid(bottomGrid, xSamples, ySamples);

  addGridSurfaceTriangles(positions, topGrid, topNormals, xSamples, ySamples, false);
  addGridSurfaceTriangles(positions, bottomGrid, bottomNormals, xSamples, ySamples, true);
  addGapSideWalls(positions, topGrid, bottomGrid, xSamples, ySamples);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry.toNonIndexed();
}

/**
 * Create a grouped shaded mesh and optional wireframe.
 *
 * @param {THREE.BufferGeometry} geometry - Geometry to shade.
 * @param {string} color - Fill color.
 * @param {number} opacity - Fill opacity.
 * @param {boolean} wireframe - Whether to add a wireframe overlay.
 * @returns {THREE.Group}
 */
export function createShadeGroup(geometry, color, opacity, wireframe) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.04,
    })
  );
  group.add(mesh);

  if (wireframe) {
    group.add(
      new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({ color: darkenHex(color, 0.5), transparent: true, opacity: Math.min(0.9, opacity + 0.15) })
      )
    );
  }

  return group;
}

/**
 * Build a curtain mesh dropping a curve to a constant z baseline.
 *
 * @param {Array<[number, number, number]>} points - Sampled curve points.
 * @param {number} baseline - Target z baseline.
 * @returns {THREE.BufferGeometry}
 */
export function buildCurtainGeometry(points, baseline) {
  const positions = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1, z1] = points[index];
    const [x2, y2, z2] = points[index + 1];
    const base1 = [x1, y1, baseline];
    const base2 = [x2, y2, baseline];
    positions.push(...x1y1z(x1, y1, z1), ...x2y2z(x2, y2, z2), ...base2);
    positions.push(...x1y1z(x1, y1, z1), ...base2, ...base1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Recolor an entire shaded group.
 *
 * @param {THREE.Group} group - Group to recolor.
 * @param {string} color - New fill color.
 */
export function recolorShadeGroup(group, color) {
  group.traverse((child) => {
    if (child.material && child.material.color) {
      child.material.color.set(color);
    }
  });
}

/**
 * Add triangulated top or bottom surface faces to a positions array.
 *
 * @param {number[]} positions - Target positions array.
 * @param {number[][]} valueGrid - Surface grid values.
 * @param {THREE.Vector3[][]} normalGrid - Precomputed normal grid.
 * @param {number[]} xSamples - X sample values.
 * @param {number[]} ySamples - Y sample values.
 * @param {boolean} reverse - Whether to flip triangle winding.
 */
function addGridSurfaceTriangles(positions, valueGrid, normalGrid, xSamples, ySamples, reverse) {
  for (let yIndex = 0; yIndex < ySamples.length - 1; yIndex += 1) {
    for (let xIndex = 0; xIndex < xSamples.length - 1; xIndex += 1) {
      const quad = [
        [xIndex, yIndex],
        [xIndex + 1, yIndex],
        [xIndex + 1, yIndex + 1],
        [xIndex, yIndex + 1],
      ];
      if (quad.some(([gridX, gridY]) => !Number.isFinite(valueGrid[gridY][gridX]))) {
        continue;
      }
      const triangles = reverse ? [[0, 2, 1], [0, 3, 2]] : [[0, 1, 2], [0, 2, 3]];
      triangles.forEach((triangle) => {
        triangle.forEach((vertexIndex) => {
          const [gridX, gridY] = quad[vertexIndex];
          positions.push(xSamples[gridX], ySamples[gridY], valueGrid[gridY][gridX]);
        });
      });
    }
  }
}

/**
 * Add side-wall quads for the gap between two surfaces.
 *
 * @param {number[]} positions - Target positions array.
 * @param {number[][]} topGrid - Top surface grid.
 * @param {number[][]} bottomGrid - Bottom surface grid.
 * @param {number[]} xSamples - X sample values.
 * @param {number[]} ySamples - Y sample values.
 */
function addGapSideWalls(positions, topGrid, bottomGrid, xSamples, ySamples) {
  const lastX = xSamples.length - 1;
  const lastY = ySamples.length - 1;

  const addWall = (aTop, bTop, bBottom, aBottom) => {
    positions.push(...aTop, ...bTop, ...bBottom);
    positions.push(...aTop, ...bBottom, ...aBottom);
  };

  for (let xIndex = 0; xIndex < lastX; xIndex += 1) {
    const frontTop1 = [xSamples[xIndex], ySamples[0], topGrid[0][xIndex]];
    const frontTop2 = [xSamples[xIndex + 1], ySamples[0], topGrid[0][xIndex + 1]];
    const frontBottom2 = [xSamples[xIndex + 1], ySamples[0], bottomGrid[0][xIndex + 1]];
    const frontBottom1 = [xSamples[xIndex], ySamples[0], bottomGrid[0][xIndex]];
    if (frontTop1.concat(frontTop2, frontBottom2, frontBottom1).every(Number.isFinite)) {
      addWall(frontTop1, frontTop2, frontBottom2, frontBottom1);
    }

    const backTop1 = [xSamples[xIndex], ySamples[lastY], topGrid[lastY][xIndex]];
    const backTop2 = [xSamples[xIndex + 1], ySamples[lastY], topGrid[lastY][xIndex + 1]];
    const backBottom2 = [xSamples[xIndex + 1], ySamples[lastY], bottomGrid[lastY][xIndex + 1]];
    const backBottom1 = [xSamples[xIndex], ySamples[lastY], bottomGrid[lastY][xIndex]];
    if (backTop1.concat(backTop2, backBottom2, backBottom1).every(Number.isFinite)) {
      addWall(backTop1, backBottom1, backBottom2, backTop2);
    }
  }

  for (let yIndex = 0; yIndex < lastY; yIndex += 1) {
    const leftTop1 = [xSamples[0], ySamples[yIndex], topGrid[yIndex][0]];
    const leftTop2 = [xSamples[0], ySamples[yIndex + 1], topGrid[yIndex + 1][0]];
    const leftBottom2 = [xSamples[0], ySamples[yIndex + 1], bottomGrid[yIndex + 1][0]];
    const leftBottom1 = [xSamples[0], ySamples[yIndex], bottomGrid[yIndex][0]];
    if (leftTop1.concat(leftTop2, leftBottom2, leftBottom1).every(Number.isFinite)) {
      addWall(leftTop1, leftBottom1, leftBottom2, leftTop2);
    }

    const rightTop1 = [xSamples[lastX], ySamples[yIndex], topGrid[yIndex][lastX]];
    const rightTop2 = [xSamples[lastX], ySamples[yIndex + 1], topGrid[yIndex + 1][lastX]];
    const rightBottom2 = [xSamples[lastX], ySamples[yIndex + 1], bottomGrid[yIndex + 1][lastX]];
    const rightBottom1 = [xSamples[lastX], ySamples[yIndex], bottomGrid[yIndex][lastX]];
    if (rightTop1.concat(rightTop2, rightBottom2, rightBottom1).every(Number.isFinite)) {
      addWall(rightTop1, rightTop2, rightBottom2, rightBottom1);
    }
  }
}

/**
 * Clamp a value into a numeric interval.
 *
 * @param {number} value - Input value.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Darken a hex color by a ratio.
 *
 * @param {string} color - Hex color.
 * @param {number} ratio - Multiplier in [0, 1].
 * @returns {string}
 */
function darkenHex(color, ratio) {
  const safe = color.startsWith("#") ? color.slice(1) : color;
  const channelValues = [safe.slice(0, 2), safe.slice(2, 4), safe.slice(4, 6)].map((value) =>
    Math.round(parseInt(value, 16) * ratio)
  );
  return `#${channelValues.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Flatten a 3D coordinate.
 *
 * @param {number} x - X value.
 * @param {number} y - Y value.
 * @param {number} z - Z value.
 * @returns {number[]}
 */
function x1y1z(x, y, z) {
  return [x, y, z];
}
