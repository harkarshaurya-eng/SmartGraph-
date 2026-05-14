import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js/+esm";
import * as TWEEN from "https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23.1.3/dist/tween.esm.js";

/**
 * Main Three.js scene controller for the SmartGraph 3D workspace.
 */
export class ThreeDGraph {
  /**
   * @param {object} options - Scene options.
   * @param {HTMLElement} options.canvasContainer - Container for the renderer.
   * @param {HTMLElement} options.fpsElement - FPS display element.
   * @param {HTMLInputElement} options.axisRangeInput - Visible axis range input.
   * @param {HTMLInputElement} options.xyGridToggle - Toggle for the XY plane.
   * @param {HTMLInputElement} options.xzGridToggle - Toggle for the XZ plane.
   * @param {HTMLInputElement} options.yzGridToggle - Toggle for the YZ plane.
   * @param {HTMLInputElement} options.backgroundInput - Background color input.
   * @param {HTMLInputElement} options.fontSizeInput - Axis label font size input.
   */
  constructor(options) {
    this.canvasContainer = options.canvasContainer;
    this.fpsElement = options.fpsElement;
    this.axisRangeInput = options.axisRangeInput;
    this.xyGridToggle = options.xyGridToggle;
    this.xzGridToggle = options.xzGridToggle;
    this.yzGridToggle = options.yzGridToggle;
    this.backgroundInput = options.backgroundInput;
    this.fontSizeInput = options.fontSizeInput;

    this.axisRange = Number(this.axisRangeInput.value) || 10;
    this.fontSize = Number(this.fontSizeInput.value) || 48;
    this.clock = new THREE.Clock();
    this.frameAccumulator = 0;
    this.frameCount = 0;
    this.objectGroups = {
      helpers: new THREE.Group(),
      user: new THREE.Group(),
      transient: new THREE.Group(),
    };
    this.resizeObserver = null;
    this.activeSliceAnimation = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundInput.value || "#0f172a");

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enablePan = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 200;
    this.controls.enableDamping = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null,
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    this.scene.add(this.objectGroups.helpers);
    this.scene.add(this.objectGroups.user);
    this.scene.add(this.objectGroups.transient);

    this.addLights();
    this.buildReferenceGeometry();
    this.setCameraPreset("isometric", false);
    this.installSettingsListeners();
    this.observeResize();
    this.animate();
  }

  /**
   * Add the required ambient, directional, and hemisphere lights.
   */
  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.65);
    this.scene.add(ambientLight, directionalLight, hemisphereLight);
  }

  /**
   * Create axes, ticks, labels, and grid helpers.
   */
  buildReferenceGeometry() {
    this.clearGroup(this.objectGroups.helpers);

    this.axisGroup = new THREE.Group();
    this.gridGroup = new THREE.Group();
    this.objectGroups.helpers.add(this.axisGroup, this.gridGroup);

    this.createAxes();
    this.createGrids();
  }

  /**
   * Create colored axes, tick marks, and billboard labels.
   */
  createAxes() {
    const axisDefinitions = [
      { key: "x", color: "#ff4444", direction: new THREE.Vector3(1, 0, 0) },
      { key: "y", color: "#44ff44", direction: new THREE.Vector3(0, 1, 0) },
      { key: "z", color: "#4444ff", direction: new THREE.Vector3(0, 0, 1) },
    ];
    const range = this.axisRange;

    axisDefinitions.forEach((axisDefinition) => {
      const points = [
        axisDefinition.direction.clone().multiplyScalar(-range),
        axisDefinition.direction.clone().multiplyScalar(range),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: axisDefinition.color });
      const axisLine = new THREE.Line(geometry, material);
      this.axisGroup.add(axisLine);

      for (let index = -range; index <= range; index += 1) {
        if (index === 0) {
          continue;
        }

        const basePosition = axisDefinition.direction.clone().multiplyScalar(index);
        const tickSize = 0.13;
        const tickPoints = this.getTickPoints(axisDefinition.key, basePosition, tickSize);
        const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
        const tickMaterial = new THREE.LineBasicMaterial({ color: axisDefinition.color, transparent: true, opacity: 0.85 });
        this.axisGroup.add(new THREE.Line(tickGeometry, tickMaterial));

        const label = this.createTextSprite(String(index), this.fontSize, axisDefinition.color);
        label.position.copy(basePosition.clone().add(this.getLabelOffset(axisDefinition.key)));
        this.axisGroup.add(label);
      }

      const axisLabel = this.createTextSprite(axisDefinition.key.toUpperCase(), this.fontSize + 8, axisDefinition.color);
      axisLabel.position.copy(axisDefinition.direction.clone().multiplyScalar(range + 0.7));
      this.axisGroup.add(axisLabel);
    });

    const originSprite = this.createTextSprite("(0, 0, 0)", this.fontSize - 4, "#e2e8f0");
    originSprite.position.set(0.4, 0.25, 0.2);
    this.axisGroup.add(originSprite);
  }

  /**
   * Get tick-mark line endpoints for a given axis.
   *
   * @param {"x"|"y"|"z"} axisKey - Axis name.
   * @param {THREE.Vector3} basePosition - Tick center position.
   * @param {number} tickSize - Tick half-length.
   * @returns {THREE.Vector3[]}
   */
  getTickPoints(axisKey, basePosition, tickSize) {
    if (axisKey === "x") {
      return [basePosition.clone().add(new THREE.Vector3(0, -tickSize, 0)), basePosition.clone().add(new THREE.Vector3(0, tickSize, 0))];
    }
    if (axisKey === "y") {
      return [basePosition.clone().add(new THREE.Vector3(-tickSize, 0, 0)), basePosition.clone().add(new THREE.Vector3(tickSize, 0, 0))];
    }
    return [basePosition.clone().add(new THREE.Vector3(-tickSize, 0, 0)), basePosition.clone().add(new THREE.Vector3(tickSize, 0, 0))];
  }

  /**
   * Get label offsets so tick labels stay legible.
   *
   * @param {"x"|"y"|"z"} axisKey - Axis name.
   * @returns {THREE.Vector3}
   */
  getLabelOffset(axisKey) {
    if (axisKey === "x") {
      return new THREE.Vector3(0, -0.35, 0);
    }
    if (axisKey === "y") {
      return new THREE.Vector3(-0.35, 0, 0);
    }
    return new THREE.Vector3(0.25, 0.15, 0);
  }

  /**
   * Create grid helpers for the XZ, XY, and YZ planes.
   */
  createGrids() {
    const gridSize = this.axisRange * 2;
    const divisions = this.axisRange * 2;

    this.xyGrid = new THREE.GridHelper(gridSize, divisions, 0x64748b, 0x334155);
    this.xyGrid.rotation.x = Math.PI / 2;
    this.xyGrid.visible = Boolean(this.xyGridToggle.checked);

    this.xzGrid = new THREE.GridHelper(gridSize, divisions, 0x64748b, 0x334155);
    this.xzGrid.visible = Boolean(this.xzGridToggle.checked);

    this.yzGrid = new THREE.GridHelper(gridSize, divisions, 0x64748b, 0x334155);
    this.yzGrid.rotation.z = Math.PI / 2;
    this.yzGrid.visible = Boolean(this.yzGridToggle.checked);

    this.gridGroup.add(this.xyGrid, this.xzGrid, this.yzGrid);
  }

  /**
   * Rebuild axis and grid helpers when settings change.
   */
  refreshReferenceGeometry() {
    this.axisRange = Number(this.axisRangeInput.value) || 10;
    this.fontSize = Number(this.fontSizeInput.value) || 48;
    this.buildReferenceGeometry();
  }

  /**
   * Install UI listeners for the settings panel.
   */
  installSettingsListeners() {
    this.axisRangeInput.addEventListener("change", () => this.refreshReferenceGeometry());
    this.fontSizeInput.addEventListener("change", () => this.refreshReferenceGeometry());

    this.xyGridToggle.addEventListener("change", () => {
      if (this.xyGrid) {
        this.xyGrid.visible = this.xyGridToggle.checked;
      }
    });
    this.xzGridToggle.addEventListener("change", () => {
      if (this.xzGrid) {
        this.xzGrid.visible = this.xzGridToggle.checked;
      }
    });
    this.yzGridToggle.addEventListener("change", () => {
      if (this.yzGrid) {
        this.yzGrid.visible = this.yzGridToggle.checked;
      }
    });

    this.backgroundInput.addEventListener("input", () => {
      this.scene.background = new THREE.Color(this.backgroundInput.value);
    });
  }

  /**
   * Observe renderer size changes and keep the canvas filled.
   */
  observeResize() {
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvasContainer);
    this.handleResize();
  }

  /**
   * Resize the renderer to match its container.
   */
  handleResize() {
    const width = Math.max(10, this.canvasContainer.clientWidth);
    const height = Math.max(10, this.canvasContainer.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /**
   * Animate the scene, controls, tweens, and FPS counter.
   */
  animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    TWEEN.update();
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.frameAccumulator += delta;
    this.frameCount += 1;
    if (this.frameAccumulator >= 0.5) {
      const fps = Math.round(this.frameCount / this.frameAccumulator);
      this.fpsElement.textContent = `${fps} FPS`;
      this.frameAccumulator = 0;
      this.frameCount = 0;
    }
  };

  /**
   * Create a floating label sprite that always faces the camera.
   *
   * @param {string} text - Sprite text.
   * @param {number} fontSize - Font size.
   * @param {string} color - Fill color.
   * @returns {THREE.Sprite}
   */
  createTextSprite(text, fontSize, color) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const safeFontSize = Math.max(18, fontSize);
    context.font = `600 ${safeFontSize}px Arial`;
    const textWidth = Math.ceil(context.measureText(text).width + 20);
    canvas.width = textWidth;
    canvas.height = Math.ceil(safeFontSize * 1.7);

    context.font = `600 ${safeFontSize}px Arial`;
    context.fillStyle = "rgba(15, 23, 42, 0.85)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(226, 232, 240, 0.25)";
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(canvas.width / 120, canvas.height / 120, 1);
    sprite.userData.dispose = () => {
      texture.dispose();
      material.dispose();
    };

    return sprite;
  }

  /**
   * Set a preset camera position, optionally with a smooth tween.
   *
   * @param {"front"|"top"|"side"|"isometric"} preset - View preset name.
   * @param {boolean} smooth - Whether to animate the move.
   */
  setCameraPreset(preset, smooth = true) {
    const presetPositions = {
      front: new THREE.Vector3(0, 0, 10),
      top: new THREE.Vector3(0, 10, 0.001),
      side: new THREE.Vector3(10, 0, 0),
      isometric: new THREE.Vector3(7, 7, 7),
    };
    const destination = presetPositions[preset] || presetPositions.isometric;

    if (!smooth) {
      this.camera.position.copy(destination);
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
      return;
    }

    const startingPosition = this.camera.position.clone();
    new TWEEN.Tween(startingPosition)
      .to(destination, 650)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.camera.position.copy(startingPosition);
        this.camera.lookAt(0, 0, 0);
      })
      .start();
  }

  /**
   * Reset the view to the requested isometric preset.
   */
  resetView() {
    this.setCameraPreset("isometric", true);
  }

  /**
   * Add an object to the permanent scene layer.
   *
   * @param {THREE.Object3D} object - Scene object to add.
   */
  addUserObject(object) {
    this.objectGroups.user.add(object);
  }

  /**
   * Remove an object from the permanent scene layer.
   *
   * @param {THREE.Object3D} object - Scene object to remove.
   */
  removeUserObject(object) {
    this.objectGroups.user.remove(object);
  }

  /**
   * Replace the transient overlay content, such as slice previews.
   *
   * @param {THREE.Object3D[]} objects - Transient objects.
   */
  setTransientObjects(objects) {
    this.clearGroup(this.objectGroups.transient);
    objects.forEach((object) => this.objectGroups.transient.add(object));
  }

  /**
   * Export the current renderer contents as a PNG image.
   */
  exportPng() {
    const link = document.createElement("a");
    link.href = this.renderer.domElement.toDataURL("image/png");
    link.download = "smartgraph-3d-view.png";
    link.click();
  }

  /**
   * Remove and dispose every child in a group.
   *
   * @param {THREE.Group} group - Group to clear.
   */
  clearGroup(group) {
    [...group.children].forEach((child) => {
      group.remove(child);
      this.disposeObject3D(child);
    });
  }

  /**
   * Dispose geometry, materials, and textures for an object tree.
   *
   * @param {THREE.Object3D} object - Object tree to dispose.
   */
  disposeObject3D(object) {
    object.traverse((child) => {
      if (child.userData && typeof child.userData.dispose === "function") {
        child.userData.dispose();
      }
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  /**
   * Dispose a material and any texture maps it owns.
   *
   * @param {THREE.Material} material - Material instance.
   */
  disposeMaterial(material) {
    Object.values(material).forEach((value) => {
      if (value && typeof value === "object" && typeof value.dispose === "function" && value !== material) {
        value.dispose();
      }
    });
    material.dispose();
  }
}

export { THREE, TWEEN };
