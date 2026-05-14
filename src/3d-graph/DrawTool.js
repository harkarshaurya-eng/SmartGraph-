import { THREE } from "./ThreeDGraph.js";
import { marchingCubes, recomputeTriangleNormals } from "./MarchingCubes.js";

/**
 * Draw-tool controller for the SmartGraph 3D workspace.
 */
export class DrawTool {
  /**
   * @param {object} options - Tool options.
   * @param {import("./ThreeDGraph.js").ThreeDGraph} options.graph - Scene graph controller.
   * @param {import("./ExpressionParser.js").ExpressionParser} options.parser - Safe expression parser.
   * @param {import("./ObjectManager.js").ObjectManager} options.objectManager - Object registry.
   * @param {HTMLElement} options.root - Draw tool root element.
   * @param {HTMLElement} options.noticeElement - Status/error element.
   */
  constructor(options) {
    this.graph = options.graph;
    this.parser = options.parser;
    this.objectManager = options.objectManager;
    this.root = options.root;
    this.noticeElement = options.noticeElement;
    this.debouncers = new Map();

    this.bindEvents();
    this.installLiveValidation();
  }

  /**
   * Bind all draw-button handlers.
   */
  bindEvents() {
    this.root.querySelector("#draw-point-button").addEventListener("click", () => this.drawPoint());
    this.root.querySelector("#draw-line-button").addEventListener("click", () => this.drawLineSegment());
    this.root.querySelector("#draw-arrow-button").addEventListener("click", () => this.drawArrow());
    this.root.querySelector("#draw-curve-button").addEventListener("click", () => this.drawParametricCurve());
    this.root.querySelector("#draw-surface-button").addEventListener("click", () => this.drawSurfacePlot());
    this.root.querySelector("#draw-implicit-button").addEventListener("click", () => this.drawImplicitSurface());
    this.root.querySelector("#draw-polygon-button").addEventListener("click", () => this.drawPolygon());
  }

  /**
   * Validate expression fields with a short debounce while the user types.
   */
  installLiveValidation() {
    const validationRules = [
      { selector: "#curve-x", variables: ["t"] },
      { selector: "#curve-y", variables: ["t"] },
      { selector: "#curve-z", variables: ["t"] },
      { selector: "#surface-expression", variables: ["x", "y"] },
      { selector: "#implicit-expression", variables: ["x", "y", "z"] },
    ];

    validationRules.forEach(({ selector, variables }) => {
      const input = this.root.querySelector(selector);
      input.addEventListener(
        "input",
        this.debounce(selector, () => {
          if (!input.value.trim()) {
            return;
          }
          try {
            this.parser.compile(input.value, variables);
            this.setNotice("");
          } catch (error) {
            this.setNotice(error.message, true);
          }
        }, 400)
      );
    });
  }

  /**
   * Draw a point or dot.
   */
  drawPoint() {
    try {
      const x = Number(this.root.querySelector("#point-x").value);
      const y = Number(this.root.querySelector("#point-y").value);
      const z = Number(this.root.querySelector("#point-z").value);
      const radius = Math.max(0.01, Number(this.root.querySelector("#point-radius").value || 0.08));
      const color = this.root.querySelector("#point-color").value || "#60a5fa";
      const labelEnabled = this.root.querySelector("#point-label").checked;

      if (![x, y, z].every(Number.isFinite)) {
        throw new Error("Please enter valid numeric coordinates for the point.");
      }

      const group = new THREE.Group();
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 16),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.08 })
      );
      sphere.position.set(x, y, z);
      group.add(sphere);

      if (labelEnabled) {
        const sprite = this.graph.createTextSprite(`(${x}, ${y}, ${z})`, 36, "#f8fafc");
        sprite.position.set(x + radius * 1.3, y + radius * 1.2, z);
        group.add(sprite);
      }

      this.objectManager.add("Point", group, (nextColor) => {
        sphere.material.color.set(nextColor);
      });
      this.setNotice("Point drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw a straight line segment or a tube if the width is large enough.
   */
  drawLineSegment() {
    try {
      const start = this.readTriplet("line-start");
      const end = this.readTriplet("line-end");
      const color = this.root.querySelector("#line-color").value || "#38bdf8";
      const width = Math.max(0.01, Number(this.root.querySelector("#line-width").value || 0.03));
      if (![...start, ...end].every(Number.isFinite)) {
        throw new Error("Please enter valid numeric coordinates for the line segment.");
      }

      const group = createLineObject(start, end, color, width);
      this.objectManager.add("Line", group, (nextColor) => recolorGroup(group, nextColor));
      this.setNotice("Line segment drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw a vector arrow from an origin in a chosen direction.
   */
  drawArrow() {
    try {
      const origin = this.readTriplet("arrow-origin");
      const direction = this.readTriplet("arrow-direction");
      const length = Math.max(0.01, Number(this.root.querySelector("#arrow-length").value || 1));
      const color = this.root.querySelector("#arrow-color").value || "#f97316";
      if (![...origin, ...direction].every(Number.isFinite)) {
        throw new Error("Please enter valid numeric values for the arrow origin and direction.");
      }

      const directionVector = new THREE.Vector3(...direction);
      if (directionVector.lengthSq() === 0) {
        throw new Error("Arrow direction cannot be the zero vector.");
      }
      directionVector.normalize();

      const arrow = new THREE.ArrowHelper(directionVector, new THREE.Vector3(...origin), length, color, length * 0.18, length * 0.1);
      this.objectManager.add("Arrow", arrow, (nextColor) => {
        arrow.setColor(new THREE.Color(nextColor));
      });
      this.setNotice("Vector arrow drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw a parametric 3D curve with discontinuity splitting.
   */
  drawParametricCurve() {
    try {
      const compiledX = this.parser.compile(this.root.querySelector("#curve-x").value, ["t"]);
      const compiledY = this.parser.compile(this.root.querySelector("#curve-y").value, ["t"]);
      const compiledZ = this.parser.compile(this.root.querySelector("#curve-z").value, ["t"]);
      const tMin = Number(this.root.querySelector("#curve-t-min").value);
      const tMax = Number(this.root.querySelector("#curve-t-max").value);
      const steps = Math.max(10, Math.min(1500, Math.round(Number(this.root.querySelector("#curve-steps").value || 200))));
      const color = this.root.querySelector("#curve-color").value || "#a78bfa";

      if (![tMin, tMax].every(Number.isFinite) || tMin === tMax) {
        throw new Error("Please enter a valid t range.");
      }

      const segments = sampleParametricCurve(this.parser, compiledX, compiledY, compiledZ, tMin, tMax, steps);
      if (segments.length === 0) {
        throw new Error("The parametric curve could not be evaluated on the chosen range.");
      }

      const group = new THREE.Group();
      segments.forEach((segmentPoints) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(segmentPoints.map((point) => new THREE.Vector3(...point)));
        const material = new THREE.LineBasicMaterial({ color });
        group.add(new THREE.Line(geometry, material));
      });

      this.objectManager.add("Curve", group, (nextColor) => recolorGroup(group, nextColor));
      this.setNotice("Parametric curve drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw a surface plot for z = f(x, y) with a color gradient and optional wireframe.
   */
  drawSurfacePlot() {
    try {
      const compiled = this.parser.compile(this.root.querySelector("#surface-expression").value, ["x", "y"]);
      const xMin = Number(this.root.querySelector("#surface-x-min").value);
      const xMax = Number(this.root.querySelector("#surface-x-max").value);
      const yMin = Number(this.root.querySelector("#surface-y-min").value);
      const yMax = Number(this.root.querySelector("#surface-y-max").value);
      const xSteps = Math.max(4, Math.min(160, Math.round(Number(this.root.querySelector("#surface-x-steps").value || 40))));
      const ySteps = Math.max(4, Math.min(160, Math.round(Number(this.root.querySelector("#surface-y-steps").value || 40))));
      const wireframe = this.root.querySelector("#surface-wireframe").checked;

      const { geometry, minZ, maxZ } = buildSurfaceGeometry(this.parser, compiled, {
        xMin,
        xMax,
        xSteps,
        yMin,
        yMax,
        ySteps,
      });

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        roughness: 0.36,
        metalness: 0.06,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);

      if (wireframe) {
        const wire = new THREE.LineSegments(
          new THREE.WireframeGeometry(geometry),
          new THREE.LineBasicMaterial({ color: "#e2e8f0", transparent: true, opacity: 0.35 })
        );
        group.add(wire);
      }

      group.userData.surfaceRange = { minZ, maxZ };
      this.objectManager.add("Surface", group, () => {});
      this.setNotice("Surface plot drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw an implicit surface F(x, y, z) = 0 using marching cubes.
   */
  drawImplicitSurface() {
    try {
      const compiled = this.parser.compile(this.root.querySelector("#implicit-expression").value, ["x", "y", "z"]);
      const bounds = {
        xMin: Number(this.root.querySelector("#implicit-x-min").value),
        xMax: Number(this.root.querySelector("#implicit-x-max").value),
        yMin: Number(this.root.querySelector("#implicit-y-min").value),
        yMax: Number(this.root.querySelector("#implicit-y-max").value),
        zMin: Number(this.root.querySelector("#implicit-z-min").value),
        zMax: Number(this.root.querySelector("#implicit-z-max").value),
      };
      const resolution = Math.max(16, Math.min(50, Math.round(Number(this.root.querySelector("#implicit-resolution").value || 30))));
      const color = this.root.querySelector("#implicit-color").value || "#22d3ee";
      const opacity = Math.max(0.15, Math.min(0.95, Number(this.root.querySelector("#implicit-opacity").value || 0.65)));

      const { mesh } = marchingCubes((x, y, z) => this.parser.evaluate(compiled, { x, y, z }), resolution, bounds, {
        color,
        opacity,
      });
      this.objectManager.add("Implicit Surface", mesh, (nextColor) => mesh.material.color.set(nextColor));
      this.setNotice("Implicit surface drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Draw a planar polygon in 3D space with fill and edge colors.
   */
  drawPolygon() {
    try {
      const points = this.parser.parsePointList(this.root.querySelector("#polygon-vertices").value);
      const fillColor = this.root.querySelector("#polygon-fill").value || "#34d399";
      const edgeColor = this.root.querySelector("#polygon-edge").value || "#064e3b";
      const group = buildPlanarPolygonObject(points, fillColor, edgeColor, 0.78);
      this.objectManager.add("Polygon", group, (nextColor) => recolorGroup(group, nextColor));
      this.setNotice("Polygon drawn.");
    } catch (error) {
      this.setNotice(error.message, true);
    }
  }

  /**
   * Read x/y/z input fields with a shared prefix.
   *
   * @param {string} prefix - Field prefix such as "line-start".
   * @returns {[number, number, number]}
   */
  readTriplet(prefix) {
    return [
      Number(this.root.querySelector(`#${prefix}-x`).value),
      Number(this.root.querySelector(`#${prefix}-y`).value),
      Number(this.root.querySelector(`#${prefix}-z`).value),
    ];
  }

  /**
   * Show a tool notice.
   *
   * @param {string} message - Feedback message.
   * @param {boolean} [isError=false] - Whether the message represents an error.
   */
  setNotice(message, isError = false) {
    this.noticeElement.textContent = message;
    this.noticeElement.dataset.error = isError ? "true" : "false";
  }

  /**
   * Create a debounced function.
   *
   * @param {string} key - Debounce key.
   * @param {Function} callback - Callback to debounce.
   * @param {number} delay - Delay in milliseconds.
   * @returns {Function}
   */
  debounce(key, callback, delay) {
    return () => {
      clearTimeout(this.debouncers.get(key));
      const timeoutId = window.setTimeout(callback, delay);
      this.debouncers.set(key, timeoutId);
    };
  }
}

/**
 * Create a line object using either a regular line or a tube mesh for thick widths.
 *
 * @param {[number, number, number]} start - Start point.
 * @param {[number, number, number]} end - End point.
 * @param {string} color - Line color.
 * @param {number} width - Requested width.
 * @returns {THREE.Group}
 */
export function createLineObject(start, end, color, width) {
  const group = new THREE.Group();
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);

  if (width > 0.06) {
    const curve = new THREE.LineCurve3(startVector, endVector);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, width * 0.18, 12, false),
      new THREE.MeshStandardMaterial({ color })
    );
    group.add(tube);
  } else {
    const geometry = new THREE.BufferGeometry().setFromPoints([startVector, endVector]);
    const material = new THREE.LineBasicMaterial({ color });
    group.add(new THREE.Line(geometry, material));
  }

  return group;
}

/**
 * Sample a parametric curve and split it across invalid points.
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Expression parser.
 * @param {{ evaluate: Function }} compiledX - Compiled x(t).
 * @param {{ evaluate: Function }} compiledY - Compiled y(t).
 * @param {{ evaluate: Function }} compiledZ - Compiled z(t).
 * @param {number} tMin - Start of the parameter range.
 * @param {number} tMax - End of the parameter range.
 * @param {number} steps - Number of parameter samples.
 * @returns {Array<Array<[number, number, number]>>}
 */
export function sampleParametricCurve(parser, compiledX, compiledY, compiledZ, tMin, tMax, steps) {
  const segments = [];
  let currentSegment = [];
  const delta = (tMax - tMin) / steps;

  for (let index = 0; index <= steps; index += 1) {
    const t = tMin + delta * index;
    const x = parser.evaluate(compiledX, { t });
    const y = parser.evaluate(compiledY, { t });
    const z = parser.evaluate(compiledZ, { t });
    if (![x, y, z].every(Number.isFinite)) {
      if (currentSegment.length >= 2) {
        segments.push(currentSegment);
      }
      currentSegment = [];
      continue;
    }
    currentSegment.push([x, y, z]);
  }

  if (currentSegment.length >= 2) {
    segments.push(currentSegment);
  }
  return segments;
}

/**
 * Build a manually triangulated surface plot for z = f(x, y).
 *
 * @param {import("./ExpressionParser.js").ExpressionParser} parser - Expression parser.
 * @param {{ evaluate: Function }} compiled - Compiled z(x, y) expression.
 * @param {{ xMin: number, xMax: number, xSteps: number, yMin: number, yMax: number, ySteps: number }} config - Surface configuration.
 * @returns {{ geometry: THREE.BufferGeometry, minZ: number, maxZ: number }}
 */
export function buildSurfaceGeometry(parser, compiled, config) {
  const { xMin, xMax, xSteps, yMin, yMax, ySteps } = config;
  if (![xMin, xMax, yMin, yMax].every(Number.isFinite) || xMin === xMax || yMin === yMax) {
    throw new Error("Please enter valid x and y ranges for the surface.");
  }

  const xSamples = Array.from({ length: xSteps + 1 }, (_, index) => xMin + ((xMax - xMin) * index) / xSteps);
  const ySamples = Array.from({ length: ySteps + 1 }, (_, index) => yMin + ((yMax - yMin) * index) / ySteps);
  const valueGrid = [];
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let yIndex = 0; yIndex <= ySteps; yIndex += 1) {
    const row = [];
    for (let xIndex = 0; xIndex <= xSteps; xIndex += 1) {
      const zValue = parser.evaluate(compiled, { x: xSamples[xIndex], y: ySamples[yIndex] });
      row.push(Number.isFinite(zValue) ? zValue : Number.NaN);
      if (Number.isFinite(zValue)) {
        minZ = Math.min(minZ, zValue);
        maxZ = Math.max(maxZ, zValue);
      }
    }
    valueGrid.push(row);
  }

  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ)) {
    throw new Error("The surface expression did not produce any finite points in the selected range.");
  }

  const normalGrid = computeSurfaceNormalGrid(valueGrid, xSamples, ySamples);
  const positions = [];
  const normals = [];
  const colors = [];

  for (let yIndex = 0; yIndex < ySteps; yIndex += 1) {
    for (let xIndex = 0; xIndex < xSteps; xIndex += 1) {
      const quadVertices = [
        [xIndex, yIndex],
        [xIndex + 1, yIndex],
        [xIndex + 1, yIndex + 1],
        [xIndex, yIndex + 1],
      ];
      const zValues = quadVertices.map(([gridX, gridY]) => valueGrid[gridY][gridX]);
      if (zValues.some((value) => !Number.isFinite(value))) {
        continue;
      }

      const triangleIndices = [
        [0, 1, 2],
        [0, 2, 3],
      ];

      triangleIndices.forEach((triangle) => {
        triangle.forEach((vertexIndex) => {
          const [gridX, gridY] = quadVertices[vertexIndex];
          const xValue = xSamples[gridX];
          const yValue = ySamples[gridY];
          const zValue = valueGrid[gridY][gridX];
          const normal = normalGrid[gridY][gridX];
          const color = colorFromValue(zValue, minZ, maxZ);
          positions.push(xValue, yValue, zValue);
          normals.push(normal.x, normal.y, normal.z);
          colors.push(color.r, color.g, color.b);
        });
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return { geometry, minZ, maxZ };
}

/**
 * Compute per-vertex normals from neighboring tangents on a sampled surface grid.
 *
 * @param {number[][]} valueGrid - Sampled z values.
 * @param {number[]} xSamples - Sampled x values.
 * @param {number[]} ySamples - Sampled y values.
 * @returns {THREE.Vector3[][]}
 */
export function computeSurfaceNormalGrid(valueGrid, xSamples, ySamples) {
  const rows = valueGrid.length;
  const columns = valueGrid[0].length;
  const normalGrid = [];

  for (let yIndex = 0; yIndex < rows; yIndex += 1) {
    const row = [];
    for (let xIndex = 0; xIndex < columns; xIndex += 1) {
      const center = valueGrid[yIndex][xIndex];
      if (!Number.isFinite(center)) {
        row.push(new THREE.Vector3(0, 1, 0));
        continue;
      }

      const leftIndex = Math.max(0, xIndex - 1);
      const rightIndex = Math.min(columns - 1, xIndex + 1);
      const downIndex = Math.max(0, yIndex - 1);
      const upIndex = Math.min(rows - 1, yIndex + 1);

      const leftPoint = new THREE.Vector3(xSamples[leftIndex], ySamples[yIndex], valueGrid[yIndex][leftIndex]);
      const rightPoint = new THREE.Vector3(xSamples[rightIndex], ySamples[yIndex], valueGrid[yIndex][rightIndex]);
      const downPoint = new THREE.Vector3(xSamples[xIndex], ySamples[downIndex], valueGrid[downIndex][xIndex]);
      const upPoint = new THREE.Vector3(xSamples[xIndex], ySamples[upIndex], valueGrid[upIndex][xIndex]);

      const tangentX = new THREE.Vector3().subVectors(rightPoint, leftPoint);
      const tangentY = new THREE.Vector3().subVectors(upPoint, downPoint);
      const normal = new THREE.Vector3().crossVectors(tangentX, tangentY).normalize();
      if (!Number.isFinite(normal.x) || normal.lengthSq() === 0) {
        row.push(new THREE.Vector3(0, 0, 1));
      } else {
        row.push(normal);
      }
    }
    normalGrid.push(row);
  }

  return normalGrid;
}

/**
 * Color-map a scalar value from cool blue through white to warm red.
 *
 * @param {number} value - Sample value.
 * @param {number} minValue - Minimum sampled value.
 * @param {number} maxValue - Maximum sampled value.
 * @returns {THREE.Color}
 */
export function colorFromValue(value, minValue, maxValue) {
  if (Math.abs(maxValue - minValue) < 1e-9) {
    return new THREE.Color("#e2e8f0");
  }

  const midpoint = (minValue + maxValue) / 2;
  if (value <= midpoint) {
    const ratio = (value - minValue) / Math.max(midpoint - minValue, 1e-9);
    return new THREE.Color().lerpColors(new THREE.Color("#1d4ed8"), new THREE.Color("#f8fafc"), ratio);
  }

  const ratio = (value - midpoint) / Math.max(maxValue - midpoint, 1e-9);
  return new THREE.Color().lerpColors(new THREE.Color("#f8fafc"), new THREE.Color("#dc2626"), ratio);
}

/**
 * Build a filled planar polygon in 3D space using projection and triangulation.
 *
 * @param {Array<[number, number, number]>} points - Polygon vertices.
 * @param {string} fillColor - Fill color.
 * @param {string} edgeColor - Edge color.
 * @param {number} opacity - Fill opacity.
 * @returns {THREE.Group}
 */
export function buildPlanarPolygonObject(points, fillColor, edgeColor, opacity = 0.7) {
  if (points.length < 3) {
    throw new Error("A polygon needs at least three vertices.");
  }

  const { planePoints2d, basisU, basisV, origin, normal } = projectPolygonToPlane(points);
  const triangles = earClip(planePoints2d);
  const positions = [];

  triangles.forEach((triangle) => {
    triangle.forEach((index) => {
      const point2d = planePoints2d[index];
      const point3d = liftPointToPlane(point2d, basisU, basisV, origin);
      positions.push(point3d.x, point3d.y, point3d.z);
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  recomputeTriangleNormals(geometry);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: fillColor,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    })
  );

  if (mesh.geometry.getAttribute("normal")) {
    const normals = mesh.geometry.getAttribute("normal");
    for (let index = 0; index < normals.count; index += 1) {
      normals.setXYZ(index, normal.x, normal.y, normal.z);
    }
    normals.needsUpdate = true;
  }

  const outlinePoints = points.concat([points[0]]).map((point) => new THREE.Vector3(...point));
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePoints),
    new THREE.LineBasicMaterial({ color: edgeColor })
  );

  const group = new THREE.Group();
  group.add(mesh, outline);
  return group;
}

/**
 * Project 3D polygon points into a 2D plane basis.
 *
 * @param {Array<[number, number, number]>} points - 3D polygon points.
 * @returns {{ planePoints2d: Array<[number, number]>, basisU: THREE.Vector3, basisV: THREE.Vector3, origin: THREE.Vector3, normal: THREE.Vector3 }}
 */
export function projectPolygonToPlane(points) {
  const origin = new THREE.Vector3(...points[0]);
  const edgeA = new THREE.Vector3(...points[1]).sub(origin);
  let normal = new THREE.Vector3();
  for (let index = 2; index < points.length; index += 1) {
    const candidate = new THREE.Vector3(...points[index]).sub(origin);
    normal.crossVectors(edgeA, candidate);
    if (normal.lengthSq() > 1e-9) {
      break;
    }
  }

  if (normal.lengthSq() === 0) {
    throw new Error("The polygon points must not all be collinear.");
  }

  normal.normalize();
  const basisU = edgeA.clone().normalize();
  const basisV = new THREE.Vector3().crossVectors(normal, basisU).normalize();
  const planePoints2d = points.map((point) => {
    const vector = new THREE.Vector3(...point).sub(origin);
    return [vector.dot(basisU), vector.dot(basisV)];
  });

  return { planePoints2d, basisU, basisV, origin, normal };
}

/**
 * Lift a 2D plane-space point back into 3D.
 *
 * @param {[number, number]} point2d - Plane-space coordinates.
 * @param {THREE.Vector3} basisU - Plane x-axis.
 * @param {THREE.Vector3} basisV - Plane y-axis.
 * @param {THREE.Vector3} origin - Plane origin.
 * @returns {THREE.Vector3}
 */
export function liftPointToPlane(point2d, basisU, basisV, origin) {
  return origin
    .clone()
    .add(basisU.clone().multiplyScalar(point2d[0]))
    .add(basisV.clone().multiplyScalar(point2d[1]));
}

/**
 * Ear-clipping triangulation for planar polygons.
 *
 * @param {Array<[number, number]>} points - 2D polygon points.
 * @returns {number[][]}
 */
export function earClip(points) {
  const triangles = [];
  const indices = points.map((_, index) => index);
  if (polygonSignedArea(points) < 0) {
    indices.reverse();
  }

  while (indices.length > 3) {
    let earFound = false;
    for (let index = 0; index < indices.length; index += 1) {
      const previous = indices[(index - 1 + indices.length) % indices.length];
      const current = indices[index];
      const next = indices[(index + 1) % indices.length];

      if (!isConvex(points[previous], points[current], points[next])) {
        continue;
      }

      const triangle = [previous, current, next];
      const containsOtherPoint = indices.some((candidate) => {
        if (triangle.includes(candidate)) {
          return false;
        }
        return pointInTriangle(points[candidate], points[previous], points[current], points[next]);
      });
      if (containsOtherPoint) {
        continue;
      }

      triangles.push(triangle);
      indices.splice(index, 1);
      earFound = true;
      break;
    }

    if (!earFound) {
      throw new Error("The polygon could not be triangulated. Please check the vertex order.");
    }
  }

  triangles.push([indices[0], indices[1], indices[2]]);
  return triangles;
}

/**
 * Recolor a group recursively.
 *
 * @param {THREE.Object3D} object - Object tree.
 * @param {string} color - CSS color.
 */
export function recolorGroup(object, color) {
  object.traverse((child) => {
    if (child.material && child.material.color) {
      child.material.color.set(color);
    }
  });
}

/**
 * Compute the signed area of a 2D polygon.
 *
 * @param {Array<[number, number]>} points - 2D polygon vertices.
 * @returns {number}
 */
function polygonSignedArea(points) {
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    total += x1 * y2 - x2 * y1;
  }
  return total / 2;
}

/**
 * Test whether a corner is convex for counter-clockwise polygon order.
 *
 * @param {[number, number]} a - Previous point.
 * @param {[number, number]} b - Current point.
 * @param {[number, number]} c - Next point.
 * @returns {boolean}
 */
function isConvex(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0;
}

/**
 * Check whether a point lies inside a triangle.
 *
 * @param {[number, number]} point - Candidate point.
 * @param {[number, number]} a - Triangle vertex.
 * @param {[number, number]} b - Triangle vertex.
 * @param {[number, number]} c - Triangle vertex.
 * @returns {boolean}
 */
function pointInTriangle(point, a, b, c) {
  const sign = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNegative && hasPositive);
}
