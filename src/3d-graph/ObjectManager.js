/**
 * Scene object registry and right-side object list UI.
 */
export class ObjectManager {
  /**
   * @param {object} options - Registry options.
   * @param {import("./ThreeDGraph.js").ThreeDGraph} options.graph - Main graph instance.
   * @param {HTMLElement} options.listElement - Container for object items.
   * @param {HTMLElement} options.statusElement - Status feedback element.
   * @param {HTMLButtonElement} options.clearButton - Clear-all button.
   */
  constructor(options) {
    this.graph = options.graph;
    this.listElement = options.listElement;
    this.statusElement = options.statusElement;
    this.clearButton = options.clearButton;
    this.entries = [];
    this.typeCounters = new Map();

    this.clearButton.addEventListener("click", () => this.clearAll());
    this.render();
  }

  /**
   * Register a new scene object.
   *
   * @param {string} typeLabel - Human-readable object type.
   * @param {THREE.Object3D} object3d - Scene object.
   * @param {(color: string) => void} recolor - Recolor callback.
   * @returns {{ id: string, name: string }}
   */
  add(typeLabel, object3d, recolor = () => {}) {
    const count = (this.typeCounters.get(typeLabel) || 0) + 1;
    this.typeCounters.set(typeLabel, count);
    const entry = {
      id: `${typeLabel.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID()}`,
      typeLabel,
      name: `${typeLabel} ${count}`,
      object3d,
      recolor,
      visible: true,
    };

    this.entries.push(entry);
    this.graph.addUserObject(object3d);
    this.render();
    this.setStatus(`${entry.name} added.`);
    return { id: entry.id, name: entry.name };
  }

  /**
   * Delete an object from the scene and UI.
   *
   * @param {string} id - Entry identifier.
   */
  delete(id) {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return;
    }

    const [entry] = this.entries.splice(index, 1);
    this.graph.removeUserObject(entry.object3d);
    this.graph.disposeObject3D(entry.object3d);
    this.render();
    this.setStatus(`${entry.name} deleted.`);
  }

  /**
   * Toggle object visibility.
   *
   * @param {string} id - Entry identifier.
   */
  toggleVisibility(id) {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry) {
      return;
    }
    entry.visible = !entry.visible;
    entry.object3d.visible = entry.visible;
    this.render();
  }

  /**
   * Recolor an object using its registered callback.
   *
   * @param {string} id - Entry identifier.
   * @param {string} color - New CSS color.
   */
  recolor(id, color) {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry) {
      return;
    }
    entry.recolor(color);
    this.setStatus(`${entry.name} recolored.`);
  }

  /**
   * Remove every user-created object.
   */
  clearAll() {
    [...this.entries].forEach((entry) => {
      this.graph.removeUserObject(entry.object3d);
      this.graph.disposeObject3D(entry.object3d);
    });
    this.entries = [];
    this.render();
    this.setStatus("All scene objects cleared.");
  }

  /**
   * Rebuild the object manager list UI.
   */
  render() {
    this.listElement.innerHTML = "";

    if (this.entries.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "object-empty";
      emptyState.textContent = "No drawn objects yet.";
      this.listElement.appendChild(emptyState);
      return;
    }

    this.entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "object-item";

      const name = document.createElement("div");
      name.className = "object-name";
      name.textContent = entry.name;

      const controls = document.createElement("div");
      controls.className = "object-controls";

      const visibilityButton = document.createElement("button");
      visibilityButton.type = "button";
      visibilityButton.className = "icon-button";
      visibilityButton.textContent = entry.visible ? "👁" : "🚫";
      visibilityButton.title = "Toggle visibility";
      visibilityButton.addEventListener("click", () => this.toggleVisibility(entry.id));

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "object-color";
      colorInput.title = "Recolor object";
      colorInput.addEventListener("input", (event) => {
        this.recolor(entry.id, event.target.value);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "icon-button danger";
      deleteButton.textContent = "✕";
      deleteButton.title = "Delete object";
      deleteButton.addEventListener("click", () => this.delete(entry.id));

      controls.append(visibilityButton, colorInput, deleteButton);
      item.append(name, controls);
      this.listElement.appendChild(item);
    });
  }

  /**
   * Show a short object-manager status message.
   *
   * @param {string} message - User feedback.
   */
  setStatus(message) {
    this.statusElement.textContent = message;
  }
}
