import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm";
import { MarchingCubes as ThreeMarchingCubes } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/objects/MarchingCubes.js/+esm";

/**
 * Build an isosurface mesh for F(x, y, z) = isoValue using the canonical Three.js marching-cubes tables.
 *
 * @param {(x: number, y: number, z: number) => number} fieldEvaluator - Scalar field evaluator.
 * @param {number} resolution - Cubic marching-cubes resolution.
 * @param {{ xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number }} bounds - World bounds.
 * @param {object} [options] - Mesh material options.
 * @param {number} [options.isoValue=0] - Target isosurface value.
 * @param {string|number} [options.color="#60a5fa"] - Mesh color.
 * @param {number} [options.opacity=0.65] - Mesh opacity.
 * @param {boolean} [options.wireframe=false] - Material wireframe flag.
 * @returns {{ mesh: THREE.Mesh, geometry: THREE.BufferGeometry }}
 */
export function marchingCubes(fieldEvaluator, resolution, bounds, options = {}) {
  const safeResolution = Math.max(10, Math.min(64, Math.round(resolution || 30)));
  const isoValue = Number.isFinite(options.isoValue) ? options.isoValue : 0;
  const proxyMaterial = new THREE.MeshStandardMaterial();
  const polyBudget = Math.max(30000, safeResolution * safeResolution * 18);
  const mc = new ThreeMarchingCubes(safeResolution, proxyMaterial, false, false, polyBudget);
  mc.isolation = isoValue;

  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const zSpan = bounds.zMax - bounds.zMin;

  for (let zIndex = 0; zIndex < safeResolution; zIndex += 1) {
    const zValue = bounds.zMin + (zIndex / (safeResolution - 1)) * zSpan;
    for (let yIndex = 0; yIndex < safeResolution; yIndex += 1) {
      const yValue = bounds.yMin + (yIndex / (safeResolution - 1)) * ySpan;
      for (let xIndex = 0; xIndex < safeResolution; xIndex += 1) {
        const xValue = bounds.xMin + (xIndex / (safeResolution - 1)) * xSpan;
        const sample = fieldEvaluator(xValue, yValue, zValue);
        mc.setCell(xIndex, yIndex, zIndex, Number.isFinite(sample) ? sample : Number.MAX_SAFE_INTEGER);
      }
    }
  }

  mc.update();
  const geometry = mc.geometry.clone().toNonIndexed();
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("color");

  const positionAttribute = geometry.getAttribute("position");
  for (let index = 0; index < positionAttribute.count; index += 1) {
    const xValue = positionAttribute.getX(index);
    const yValue = positionAttribute.getY(index);
    const zValue = positionAttribute.getZ(index);

    positionAttribute.setXYZ(
      index,
      mapNormalizedCoordinate(xValue, bounds.xMin, bounds.xMax),
      mapNormalizedCoordinate(yValue, bounds.yMin, bounds.yMax),
      mapNormalizedCoordinate(zValue, bounds.zMin, bounds.zMax)
    );
  }
  positionAttribute.needsUpdate = true;
  recomputeTriangleNormals(geometry);
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    color: options.color || "#60a5fa",
    transparent: true,
    opacity: Number.isFinite(options.opacity) ? options.opacity : 0.65,
    side: THREE.DoubleSide,
    wireframe: Boolean(options.wireframe),
    roughness: 0.42,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  proxyMaterial.dispose();
  mc.geometry.dispose();
  return { mesh, geometry };
}

/**
 * Map a marching-cubes coordinate from [-1, 1] back to the requested world range.
 *
 * @param {number} value - Normalized coordinate.
 * @param {number} min - World minimum.
 * @param {number} max - World maximum.
 * @returns {number}
 */
function mapNormalizedCoordinate(value, min, max) {
  const ratio = (value + 1) / 2;
  return min + ratio * (max - min);
}

/**
 * Recompute triangle normals manually from the geometry positions.
 *
 * @param {THREE.BufferGeometry} geometry - Non-indexed triangle geometry.
 */
export function recomputeTriangleNormals(geometry) {
  const positionAttribute = geometry.getAttribute("position");
  const normals = new Float32Array(positionAttribute.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let index = 0; index < positionAttribute.count; index += 3) {
    a.fromBufferAttribute(positionAttribute, index);
    b.fromBufferAttribute(positionAttribute, index + 1);
    c.fromBufferAttribute(positionAttribute, index + 2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();

    for (let offset = 0; offset < 3; offset += 1) {
      normals[(index + offset) * 3 + 0] = normal.x;
      normals[(index + offset) * 3 + 1] = normal.y;
      normals[(index + offset) * 3 + 2] = normal.z;
    }
  }

  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
}
