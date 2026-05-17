import { getIntegralGraphConfig } from "./getIntegralGraphConfig.js";
import { IntegralGraphRenderer } from "./IntegralGraphRenderer.js";
import { integralQuestions } from "./integralQuestions.js";

export class IntegralGraphVisualizer {
  constructor(options) {
    this.selectElement = options.selectElement;
    this.resetButton = options.resetButton;
    this.expressionElement = options.expressionElement;
    this.regionElement = options.regionElement;
    this.drawSummaryElement = options.drawSummaryElement;
    this.descriptionElement = options.descriptionElement;
    this.titleElement = options.titleElement;
    this.graphTypeElement = options.graphTypeElement;
    this.captionElement = options.captionElement;
    this.renderer = new IntegralGraphRenderer(options.diagramElement);

    this.populateQuestionOptions();
    this.bindEvents();
    this.resetSelection();
  }

  populateQuestionOptions() {
    integralQuestions.forEach((question) => {
      const option = document.createElement("option");
      option.value = question.id;
      option.textContent = question.label;
      this.selectElement.appendChild(option);
    });
  }

  bindEvents() {
    this.selectElement.addEventListener("change", () => {
      this.renderSelection(this.selectElement.value);
    });

    this.resetButton.addEventListener("click", () => {
      this.resetSelection();
    });
  }

  renderSelection(questionId) {
    const config = getIntegralGraphConfig(questionId);
    if (!config) {
      this.resetSelection();
      return;
    }

    this.expressionElement.textContent = config.expression;
    this.regionElement.textContent = config.region;
    this.drawSummaryElement.textContent = config.drawSummary;
    this.descriptionElement.textContent = config.description;
    this.titleElement.textContent = config.title;
    this.graphTypeElement.textContent = config.title;
    this.captionElement.textContent = `${config.drawSummary} SmartGraph keeps this preview hard-coded so students can compare shapes without running a solver.`;
    this.renderer.render(config);
  }

  resetSelection() {
    this.selectElement.value = "";
    this.expressionElement.textContent = "Choose a question to preview its region or volume.";
    this.regionElement.textContent = "The selected question's geometric bounds will appear here.";
    this.drawSummaryElement.textContent =
      "Each preview uses a fixed SVG sketch for the matching graph type.";
    this.descriptionElement.textContent =
      "Start with any dropdown option to inspect the relevant 2D region, surface, or shaded 3D volume.";
    this.titleElement.textContent = "Integral Graph Visualiser";
    this.graphTypeElement.textContent = "Awaiting selection";
    this.captionElement.textContent =
      "Each preview is a hand-crafted SVG diagram that highlights the region or bounded solid named by the selected question.";
    this.renderer.renderEmptyState();
  }
}
