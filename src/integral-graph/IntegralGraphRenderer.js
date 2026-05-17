const VIEW_BOX = "0 0 640 440";

const COLORS = {
  ink: "#102033",
  muted: "#5a6c82",
  grid: "#dbe7f3",
  frame: "#c7d6e5",
  accent: "#2563eb",
  accentSoft: "#93c5fd",
  teal: "#0f766e",
  tealSoft: "#99f6e4",
  warm: "#f97316",
  warmSoft: "#fdba74",
  plane: "#f59e0b",
  planeSoft: "#fde68a",
  shade: "#3b82f6",
  shadeSoft: "#bfdbfe",
  surface: "#1d4ed8",
};

export class IntegralGraphRenderer {
  constructor(hostElement) {
    this.hostElement = hostElement;
  }

  render(config) {
    const renderDiagram = RENDERERS[config.graphType] ?? renderFallback;
    this.hostElement.innerHTML = renderDiagram(config);
  }

  renderEmptyState() {
    this.hostElement.innerHTML = renderEmptyState();
  }
}

const RENDERERS = {
  boundedRegion2D: renderBoundedRegion2D,
  coneVolume: renderConeVolume,
  cylinderParaboloid: renderCylinderParaboloid,
  paraboloidPlane: renderParaboloidPlane,
  positiveOctant: renderPositiveOctant,
  sphereOctant: renderSphereOctant,
  downwardParaboloid: renderDownwardParaboloid,
  coneParaboloid: renderConeParaboloid,
  paraboloidSlantedPlane: renderParaboloidSlantedPlane,
  offsetCylinderParaboloid: renderOffsetCylinderParaboloid,
  shiftedCylinderParaboloid: renderShiftedCylinderParaboloid,
  sphereParaboloid: renderSphereParaboloid,
  cylinderSlantedPlane: renderCylinderSlantedPlane,
  parabolicBasePlane: renderParabolicBasePlane,
  tetrahedron: renderTetrahedron,
};

function renderEmptyState() {
  const content = [
    rect(22, 22, 596, 396, {
      rx: 28,
      fill: "url(#panelGradient)",
      stroke: COLORS.frame,
      "stroke-width": 1.5,
    }),
    line(96, 338, 400, 338, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    line(96, 338, 96, 112, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    path("M 170 318 C 220 252, 295 208, 372 172", {
      fill: "none",
      stroke: COLORS.accent,
      "stroke-width": 5,
      "stroke-linecap": "round",
    }),
    ellipse(442, 210, 108, 68, {
      fill: "rgba(59,130,246,0.08)",
      stroke: COLORS.surface,
      "stroke-width": 3,
    }),
    path("M 410 218 C 440 145, 498 136, 532 210", {
      fill: "none",
      stroke: COLORS.warm,
      "stroke-width": 4,
      "stroke-linecap": "round",
    }),
    textLabel(106, 104, "y", { fill: COLORS.ink, "font-weight": 700 }),
    textLabel(408, 354, "x", { fill: COLORS.ink, "font-weight": 700 }),
    textLabel(320, 116, "Select a question to load the matching diagram.", {
      fill: COLORS.ink,
      "font-size": 22,
      "font-weight": 700,
      "text-anchor": "middle",
    }),
    textLabel(320, 150, "SmartGraph keeps these previews hard-coded and solver-free.", {
      fill: COLORS.muted,
      "font-size": 15,
      "text-anchor": "middle",
    }),
    textLabel(320, 377, "2D regions, cones, spheres, cylinders, paraboloids, and tetrahedra", {
      fill: COLORS.teal,
      "font-size": 16,
      "font-weight": 700,
      "text-anchor": "middle",
    }),
  ].join("");

  return wrapSvg(content, "Empty integral graph visualiser state");
}

function renderFallback(config) {
  return wrapSvg(
    [
      rect(24, 24, 592, 392, {
        rx: 28,
        fill: "url(#panelGradient)",
        stroke: COLORS.frame,
      }),
      textLabel(320, 188, "Diagram unavailable", {
        fill: COLORS.ink,
        "font-size": 26,
        "font-weight": 700,
        "text-anchor": "middle",
      }),
      textLabel(320, 224, `${config.title} does not have a renderer yet.`, {
        fill: COLORS.muted,
        "font-size": 16,
        "text-anchor": "middle",
      }),
    ].join(""),
    `${config.title} fallback diagram`
  );
}

function renderBoundedRegion2D(config) {
  const xOrigin = 116;
  const yOrigin = 338;
  const xStart = 146;
  const xEnd = 382;
  const samples = Array.from({ length: 30 }, (_, index) => {
    const xValue = index / 29;
    const yValue = Math.sqrt(1 + xValue * xValue);
    return {
      x: xStart + xValue * (xEnd - xStart),
      y: yOrigin - (yValue / 1.7) * 188,
    };
  });
  const regionPoints = [{ x: xStart, y: yOrigin }, ...samples, { x: xEnd, y: yOrigin }];

  const content = [
    buildPlotBackdrop(),
    line(xOrigin, yOrigin, 510, yOrigin, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    line(xOrigin, yOrigin, xOrigin, 92, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    polygon(regionPoints, {
      fill: "rgba(59,130,246,0.22)",
      stroke: "rgba(37,99,235,0.18)",
      "stroke-width": 1.5,
    }),
    pathFromPoints(samples, false, {
      fill: "none",
      stroke: COLORS.surface,
      "stroke-width": 4,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
    line(xStart, yOrigin, xStart, samples[0].y, {
      stroke: COLORS.accent,
      "stroke-width": 3,
    }),
    line(xEnd, yOrigin, xEnd, samples[samples.length - 1].y, {
      stroke: COLORS.warm,
      "stroke-width": 3,
      "stroke-dasharray": "8 7",
    }),
    textLabel(xOrigin - 8, yOrigin + 16, "0", { fill: COLORS.muted, "font-size": 14 }),
    textLabel(xEnd, yOrigin + 22, "1", { fill: COLORS.warm, "font-size": 14, "text-anchor": "middle" }),
    textLabel(520, yOrigin + 8, "x", { fill: COLORS.ink, "font-weight": 700 }),
    textLabel(xOrigin - 10, 82, "y", { fill: COLORS.ink, "font-weight": 700 }),
    callout(config.annotations.curveLabel, 430, 152, 332, 168, COLORS.surface),
    callout("shaded region", 442, 286, 286, 240, COLORS.accent),
    callout("x=1", 432, 338, xEnd, 248, COLORS.warm),
    textLabel(322, 48, config.title, {
      fill: COLORS.ink,
      "font-size": 24,
      "font-weight": 700,
      "text-anchor": "middle",
    }),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderConeVolume(config) {
  const content = [
    buildAxes3D(),
    coneShape({
      apexX: 168,
      apexY: 340,
      topCx: 278,
      topCy: 170,
      rx: 112,
      ry: 32,
      fill: "rgba(59,130,246,0.22)",
      stroke: COLORS.surface,
    }),
    ellipse(278, 170, 112, 32, {
      fill: "rgba(245,158,11,0.14)",
      stroke: COLORS.warm,
      "stroke-width": 2.5,
    }),
    callout(config.annotations.surfaceLabel, 430, 204, 248, 248, COLORS.surface),
    callout(config.annotations.planeLabel, 424, 132, 356, 170, COLORS.warm),
    callout("shaded cone volume", 454, 286, 260, 250, COLORS.accent),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderCylinderParaboloid(config) {
  const content = [
    buildAxes3D(),
    cylinderShape({
      cx: 252,
      topY: 182,
      bottomY: 320,
      rx: 118,
      ry: 34,
      fill: "rgba(15,118,110,0.12)",
      stroke: COLORS.teal,
    }),
    ellipse(252, 320, 118, 34, {
      fill: "rgba(245,158,11,0.12)",
      stroke: COLORS.warm,
      "stroke-width": 2,
    }),
    paraboloidUpShape({
      cx: 252,
      topY: 186,
      bottomY: 320,
      topRx: 110,
      topRy: 30,
      fill: "rgba(59,130,246,0.18)",
      stroke: COLORS.surface,
    }),
    callout(config.annotations.wallLabel, 428, 165, 368, 198, COLORS.teal),
    callout(config.annotations.surfaceLabel, 428, 228, 288, 232, COLORS.surface),
    callout(config.annotations.baseLabel, 408, 340, 330, 320, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderParaboloidPlane(config) {
  const content = [
    buildAxes3D(),
    slantedPlane(
      [
        { x: 130, y: 170 },
        { x: 376, y: 170 },
        { x: 446, y: 210 },
        { x: 202, y: 210 },
      ],
      {
        fill: "rgba(245,158,11,0.16)",
        stroke: COLORS.warm,
        "stroke-width": 2.5,
      }
    ),
    paraboloidUpShape({
      cx: 252,
      topY: 170,
      bottomY: 324,
      topRx: 124,
      topRy: 36,
      fill: "rgba(59,130,246,0.18)",
      stroke: COLORS.surface,
    }),
    ellipse(252, 170, 124, 36, {
      fill: "none",
      stroke: COLORS.warm,
      "stroke-width": 2.5,
    }),
    callout(config.annotations.surfaceLabel, 436, 242, 300, 246, COLORS.surface),
    callout(config.annotations.planeLabel, 434, 128, 384, 170, COLORS.warm),
    callout(config.annotations.intersectionLabel, 420, 318, 356, 198, COLORS.teal),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderPositiveOctant(config) {
  const content = [
    buildAxes3D({ showInfinity: true }),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 394, y: 390 },
        { x: 314, y: 426 },
        { x: 58, y: 390 },
      ],
      {
        fill: "rgba(59,130,246,0.12)",
        stroke: COLORS.frame,
        "stroke-width": 1.5,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 166, y: 106 },
        { x: 60, y: 170 },
        { x: 58, y: 390 },
      ],
      {
        fill: "rgba(15,118,110,0.12)",
        stroke: COLORS.frame,
        "stroke-width": 1.5,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 166, y: 106 },
        { x: 392, y: 170 },
        { x: 394, y: 390 },
      ],
      {
        fill: "rgba(245,158,11,0.12)",
        stroke: COLORS.frame,
        "stroke-width": 1.5,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 278, y: 362 },
        { x: 278, y: 254 },
        { x: 166, y: 220 },
        { x: 114, y: 250 },
        { x: 114, y: 362 },
      ],
      {
        fill: "rgba(37,99,235,0.22)",
        stroke: COLORS.surface,
        "stroke-width": 2,
      }
    ),
    callout(config.annotations.octantLabel, 426, 210, 260, 258, COLORS.surface),
    callout(config.annotations.limitLabel, 430, 132, 394, 170, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderSphereOctant(config) {
  const content = [
    buildAxes3D(),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 166, y: 106 },
        { x: 58, y: 390 },
      ],
      {
        fill: "rgba(15,118,110,0.1)",
        stroke: COLORS.frame,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 394, y: 390 },
        { x: 166, y: 106 },
      ],
      {
        fill: "rgba(245,158,11,0.08)",
        stroke: COLORS.frame,
      }
    ),
    path(
      "M 166 106 C 254 118, 318 188, 324 286 C 276 320, 220 334, 166 340 C 145 288, 126 228, 112 170 C 126 146, 144 122, 166 106 Z",
      {
        fill: "rgba(59,130,246,0.24)",
        stroke: COLORS.surface,
        "stroke-width": 3,
      }
    ),
    ellipse(218, 230, 164, 116, {
      fill: "none",
      stroke: COLORS.frame,
      "stroke-width": 2,
      "stroke-dasharray": "7 8",
    }),
    callout(config.annotations.surfaceLabel, 432, 170, 276, 188, COLORS.surface),
    callout(config.annotations.radiusLabel, 420, 276, 242, 260, COLORS.teal),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderDownwardParaboloid(config) {
  const content = [
    buildAxes3D(),
    ellipse(252, 320, 132, 38, {
      fill: "rgba(245,158,11,0.12)",
      stroke: COLORS.warm,
      "stroke-width": 2.5,
    }),
    paraboloidDownShape({
      cx: 252,
      apexY: 132,
      baseY: 320,
      baseRx: 132,
      baseRy: 38,
      fill: "rgba(59,130,246,0.22)",
      stroke: COLORS.surface,
    }),
    callout(config.annotations.surfaceLabel, 432, 166, 296, 192, COLORS.surface),
    callout(config.annotations.planeLabel, 412, 340, 332, 320, COLORS.warm),
    callout(config.annotations.baseLabel, 420, 286, 340, 302, COLORS.teal),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderConeParaboloid(config) {
  const content = [
    buildAxes3D(),
    coneShape({
      apexX: 166,
      apexY: 340,
      topCx: 260,
      topCy: 176,
      rx: 108,
      ry: 32,
      fill: "rgba(59,130,246,0.14)",
      stroke: COLORS.surface,
    }),
    paraboloidUpShape({
      cx: 260,
      topY: 176,
      bottomY: 338,
      topRx: 108,
      topRy: 32,
      fill: "rgba(245,158,11,0.14)",
      stroke: COLORS.warm,
    }),
    ellipse(260, 176, 108, 32, {
      fill: "none",
      stroke: COLORS.teal,
      "stroke-width": 2.5,
    }),
    callout(config.annotations.coneLabel, 432, 206, 250, 238, COLORS.surface),
    callout(config.annotations.paraboloidLabel, 432, 272, 284, 250, COLORS.warm),
    callout(config.annotations.intersectionLabel, 420, 132, 360, 176, COLORS.teal),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderParaboloidSlantedPlane(config) {
  const content = [
    buildAxes3D(),
    paraboloidUpShape({
      cx: 252,
      topY: 208,
      bottomY: 324,
      topRx: 116,
      topRy: 34,
      fill: "rgba(59,130,246,0.18)",
      stroke: COLORS.surface,
    }),
    slantedPlane(
      [
        { x: 176, y: 205 },
        { x: 368, y: 160 },
        { x: 448, y: 214 },
        { x: 258, y: 258 },
      ],
      {
        fill: "rgba(245,158,11,0.16)",
        stroke: COLORS.warm,
        "stroke-width": 2.5,
      }
    ),
    ellipse(252, 324, 116, 34, {
      fill: "none",
      stroke: COLORS.frame,
      "stroke-width": 2,
      "stroke-dasharray": "7 8",
    }),
    callout(config.annotations.surfaceLabel, 432, 260, 300, 246, COLORS.surface),
    callout(config.annotations.planeLabel, 432, 140, 378, 170, COLORS.warm),
    callout(config.annotations.baseLabel, 420, 334, 336, 320, COLORS.teal),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderOffsetCylinderParaboloid(config) {
  const content = [
    buildAxes3D(),
    cylinderShape({
      cx: 308,
      topY: 184,
      bottomY: 320,
      rx: 104,
      ry: 30,
      fill: "rgba(15,118,110,0.12)",
      stroke: COLORS.teal,
    }),
    paraboloidUpShape({
      cx: 252,
      topY: 200,
      bottomY: 320,
      topRx: 124,
      topRy: 34,
      fill: "rgba(59,130,246,0.18)",
      stroke: COLORS.surface,
    }),
    ellipse(252, 320, 124, 34, {
      fill: "rgba(245,158,11,0.1)",
      stroke: COLORS.warm,
      "stroke-width": 2,
    }),
    callout(config.annotations.wallLabel, 434, 172, 372, 194, COLORS.teal),
    callout(config.annotations.surfaceLabel, 430, 242, 302, 248, COLORS.surface),
    callout(config.annotations.baseLabel, 406, 340, 332, 320, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderShiftedCylinderParaboloid(config) {
  const content = [
    buildAxes3D(),
    cylinderShape({
      cx: 216,
      topY: 172,
      bottomY: 308,
      rx: 108,
      ry: 32,
      fill: "rgba(15,118,110,0.12)",
      stroke: COLORS.teal,
    }),
    paraboloidUpShape({
      cx: 258,
      topY: 194,
      bottomY: 320,
      topRx: 122,
      topRy: 34,
      fill: "rgba(59,130,246,0.18)",
      stroke: COLORS.surface,
    }),
    ellipse(258, 320, 122, 34, {
      fill: "rgba(245,158,11,0.1)",
      stroke: COLORS.warm,
      "stroke-width": 2,
    }),
    callout(config.annotations.wallLabel, 432, 162, 292, 180, COLORS.teal),
    callout(config.annotations.surfaceLabel, 428, 242, 304, 248, COLORS.surface),
    callout(config.annotations.baseLabel, 406, 340, 334, 320, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderSphereParaboloid(config) {
  const content = [
    buildAxes3D(),
    ellipse(252, 214, 170, 120, {
      fill: "rgba(59,130,246,0.08)",
      stroke: COLORS.frame,
      "stroke-width": 2,
      "stroke-dasharray": "7 8",
    }),
    paraboloidUpShape({
      cx: 252,
      topY: 214,
      bottomY: 336,
      topRx: 126,
      topRy: 36,
      fill: "rgba(59,130,246,0.2)",
      stroke: COLORS.surface,
    }),
    path("M 120 214 C 160 132, 340 130, 384 214", {
      fill: "none",
      stroke: COLORS.accent,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    path("M 120 214 C 170 298, 334 300, 384 214", {
      fill: "none",
      stroke: COLORS.accent,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    ellipse(252, 214, 126, 36, {
      fill: "none",
      stroke: COLORS.warm,
      "stroke-width": 2.5,
    }),
    callout(config.annotations.sphereLabel, 432, 150, 352, 168, COLORS.accent),
    callout(config.annotations.paraboloidLabel, 428, 246, 304, 250, COLORS.surface),
    callout(config.annotations.intersectionLabel, 418, 316, 348, 214, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderCylinderSlantedPlane(config) {
  const content = [
    buildAxes3D(),
    cylinderShape({
      cx: 252,
      topY: 168,
      bottomY: 320,
      rx: 116,
      ry: 34,
      fill: "rgba(59,130,246,0.14)",
      stroke: COLORS.teal,
    }),
    slantedPlane(
      [
        { x: 170, y: 170 },
        { x: 348, y: 142 },
        { x: 432, y: 206 },
        { x: 252, y: 236 },
      ],
      {
        fill: "rgba(245,158,11,0.16)",
        stroke: COLORS.warm,
        "stroke-width": 2.5,
      }
    ),
    ellipse(252, 320, 116, 34, {
      fill: "rgba(245,158,11,0.1)",
      stroke: COLORS.warm,
      "stroke-width": 2,
    }),
    callout(config.annotations.wallLabel, 432, 170, 364, 182, COLORS.teal),
    callout(config.annotations.planeLabel, 432, 136, 372, 156, COLORS.warm),
    callout(config.annotations.baseLabel, 404, 340, 332, 320, COLORS.surface),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderParabolicBasePlane(config) {
  const content = [
    buildAxes3D(),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 394, y: 390 },
        { x: 316, y: 426 },
        { x: 58, y: 390 },
      ],
      {
        fill: "rgba(59,130,246,0.08)",
        stroke: COLORS.frame,
        "stroke-width": 1.5,
      }
    ),
    path("M 170 336 C 202 314, 236 312, 280 330 C 252 356, 220 366, 188 360 C 176 354, 168 346, 170 336 Z", {
      fill: "rgba(59,130,246,0.22)",
      stroke: COLORS.surface,
      "stroke-width": 2.5,
    }),
    path("M 170 336 C 202 314, 232 318, 280 330", {
      fill: "none",
      stroke: COLORS.teal,
      "stroke-width": 2.5,
    }),
    path("M 170 336 C 202 362, 234 362, 280 330", {
      fill: "none",
      stroke: COLORS.warm,
      "stroke-width": 2.5,
    }),
    slantedPlane(
      [
        { x: 206, y: 176 },
        { x: 418, y: 146 },
        { x: 360, y: 254 },
        { x: 188, y: 282 },
      ],
      {
        fill: "rgba(245,158,11,0.16)",
        stroke: COLORS.warm,
        "stroke-width": 2.5,
      }
    ),
    line(170, 336, 206, 176, { stroke: COLORS.surface, "stroke-width": 2 }),
    line(224, 354, 270, 184, { stroke: COLORS.surface, "stroke-width": 2 }),
    line(280, 330, 360, 254, { stroke: COLORS.surface, "stroke-width": 2 }),
    callout(config.annotations.curveALabel, 430, 238, 236, 318, COLORS.teal),
    callout(config.annotations.curveBLabel, 430, 286, 226, 356, COLORS.warm),
    callout(config.annotations.planeLabel, 426, 150, 374, 166, COLORS.surface),
    callout(config.annotations.intersectionLabel, 418, 334, 280, 330, COLORS.accent),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function renderTetrahedron(config) {
  const content = [
    buildAxes3D(),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 394, y: 390 },
        { x: 58, y: 390 },
      ],
      {
        fill: "rgba(59,130,246,0.1)",
        stroke: COLORS.frame,
        "stroke-width": 1.5,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 394, y: 390 },
        { x: 166, y: 106 },
      ],
      {
        fill: "rgba(245,158,11,0.14)",
        stroke: COLORS.warm,
        "stroke-width": 2,
      }
    ),
    polygon(
      [
        { x: 166, y: 340 },
        { x: 58, y: 390 },
        { x: 166, y: 106 },
      ],
      {
        fill: "rgba(15,118,110,0.14)",
        stroke: COLORS.teal,
        "stroke-width": 2,
      }
    ),
    polygon(
      [
        { x: 394, y: 390 },
        { x: 58, y: 390 },
        { x: 166, y: 106 },
      ],
      {
        fill: "rgba(59,130,246,0.2)",
        stroke: COLORS.surface,
        "stroke-width": 2.5,
      }
    ),
    callout(config.annotations.planeLabel, 432, 154, 270, 202, COLORS.surface),
    callout(config.annotations.interceptsLabel, 422, 328, 360, 388, COLORS.warm),
  ].join("");

  return wrapSvg(content, `${config.title} diagram`);
}

function wrapSvg(content, label) {
  return `
    <svg viewBox="${VIEW_BOX}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(label)}">
      <defs>
        <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f4f8fc" />
        </linearGradient>
        <marker id="axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.ink}" />
        </marker>
      </defs>
      ${buildFrame()}
      ${content}
    </svg>
  `;
}

function buildFrame() {
  const verticalLines = Array.from({ length: 6 }, (_, index) =>
    line(84 + index * 90, 34, 84 + index * 90, 404, {
      stroke: COLORS.grid,
      "stroke-width": 1,
    })
  ).join("");
  const horizontalLines = Array.from({ length: 5 }, (_, index) =>
    line(34, 84 + index * 74, 606, 84 + index * 74, {
      stroke: COLORS.grid,
      "stroke-width": 1,
    })
  ).join("");

  return [
    rect(20, 20, 600, 400, {
      rx: 28,
      fill: "url(#panelGradient)",
      stroke: COLORS.frame,
      "stroke-width": 1.5,
    }),
    verticalLines,
    horizontalLines,
  ].join("");
}

function buildPlotBackdrop() {
  return [
    rect(60, 58, 488, 320, {
      rx: 24,
      fill: "rgba(255,255,255,0.4)",
      stroke: "rgba(199,214,229,0.8)",
      "stroke-width": 1.4,
    }),
    line(146, 338, 146, 98, { stroke: COLORS.grid, "stroke-width": 1.5 }),
    line(382, 338, 382, 118, { stroke: COLORS.grid, "stroke-width": 1.5 }),
    line(116, 228, 506, 228, { stroke: COLORS.grid, "stroke-width": 1.5 }),
  ].join("");
}

function buildAxes3D(options = {}) {
  const originX = options.originX ?? 166;
  const originY = options.originY ?? 340;
  const xEnd = { x: options.xEndX ?? 394, y: options.xEndY ?? 390 };
  const yEnd = { x: options.yEndX ?? 58, y: options.yEndY ?? 390 };
  const zEnd = { x: options.zEndX ?? 166, y: options.zEndY ?? 106 };

  return [
    line(originX, originY, xEnd.x, xEnd.y, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    line(originX, originY, yEnd.x, yEnd.y, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    line(originX, originY, zEnd.x, zEnd.y, {
      stroke: COLORS.ink,
      "stroke-width": 3,
      "marker-end": "url(#axis-arrow)",
    }),
    circle(originX, originY, 5, { fill: COLORS.ink }),
    textLabel(xEnd.x + 14, xEnd.y + 2, options.xLabel ?? "x", {
      fill: COLORS.ink,
      "font-size": 17,
      "font-weight": 700,
    }),
    textLabel(yEnd.x - 12, yEnd.y + 6, options.yLabel ?? "y", {
      fill: COLORS.ink,
      "font-size": 17,
      "font-weight": 700,
    }),
    textLabel(zEnd.x - 10, zEnd.y - 12, options.zLabel ?? "z", {
      fill: COLORS.ink,
      "font-size": 17,
      "font-weight": 700,
    }),
    options.showInfinity
      ? textLabel(xEnd.x + 34, xEnd.y + 2, "∞", { fill: COLORS.warm, "font-size": 20, "font-weight": 700 })
      : "",
    options.showInfinity
      ? textLabel(yEnd.x - 30, yEnd.y + 8, "∞", { fill: COLORS.warm, "font-size": 20, "font-weight": 700 })
      : "",
    options.showInfinity
      ? textLabel(zEnd.x - 8, zEnd.y - 34, "∞", { fill: COLORS.warm, "font-size": 20, "font-weight": 700 })
      : "",
  ].join("");
}

function coneShape({ apexX, apexY, topCx, topCy, rx, ry, fill, stroke }) {
  return [
    path(`M ${apexX} ${apexY} L ${topCx - rx} ${topCy} A ${rx} ${ry} 0 0 0 ${topCx + rx} ${topCy} Z`, {
      fill,
      stroke: "none",
    }),
    path(`M ${topCx - rx} ${topCy} A ${rx} ${ry} 0 0 1 ${topCx + rx} ${topCy}`, {
      fill: "none",
      stroke,
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
    }),
    path(`M ${topCx - rx} ${topCy} A ${rx} ${ry} 0 0 0 ${topCx + rx} ${topCy}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
    }),
    line(apexX, apexY, topCx - rx, topCy, { stroke, "stroke-width": 3 }),
    line(apexX, apexY, topCx + rx, topCy, { stroke, "stroke-width": 3 }),
    line(apexX, apexY, topCx, topCy - ry, {
      stroke,
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
    }),
  ].join("");
}

function cylinderShape({ cx, topY, bottomY, rx, ry, fill, stroke }) {
  return [
    path(`M ${cx - rx} ${topY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${topY}`, {
      fill: "none",
      stroke,
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
    }),
    path(`M ${cx - rx} ${topY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${topY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
    }),
    path(`M ${cx - rx} ${topY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${topY} L ${cx + rx} ${bottomY} A ${rx} ${ry} 0 0 1 ${cx - rx} ${bottomY} Z`, {
      fill,
      stroke: "none",
    }),
    line(cx - rx, topY, cx - rx, bottomY, { stroke, "stroke-width": 3 }),
    line(cx + rx, topY, cx + rx, bottomY, { stroke, "stroke-width": 3 }),
    path(`M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${bottomY}`, {
      fill: "none",
      stroke,
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
    }),
    path(`M ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
    }),
  ].join("");
}

function paraboloidUpShape({ cx, topY, bottomY, topRx, topRy, fill, stroke }) {
  const ringScales = [0.35, 0.6, 0.82];
  return [
    path(
      `M ${cx - topRx} ${topY} A ${topRx} ${topRy} 0 0 0 ${cx + topRx} ${topY} C ${cx + topRx * 0.62} ${topY + 44}, ${cx + 54} ${bottomY - 18}, ${cx} ${bottomY} C ${cx - 54} ${bottomY - 18}, ${cx - topRx * 0.62} ${topY + 44}, ${cx - topRx} ${topY} Z`,
      {
        fill,
        stroke: "none",
      }
    ),
    ...ringScales.map((scale) =>
      ellipse(
        cx,
        bottomY - (bottomY - topY) * scale * scale,
        topRx * scale,
        Math.max(10, topRy * scale),
        {
          fill: "none",
          stroke: COLORS.accentSoft,
          "stroke-width": 1.6,
        }
      )
    ),
    path(`M ${cx - topRx} ${topY} C ${cx - topRx * 0.74} ${topY + 44}, ${cx - 54} ${bottomY - 18}, ${cx} ${bottomY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    path(`M ${cx + topRx} ${topY} C ${cx + topRx * 0.74} ${topY + 44}, ${cx + 54} ${bottomY - 18}, ${cx} ${bottomY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    ellipse(cx, topY, topRx, topRy, {
      fill: "none",
      stroke,
      "stroke-width": 3,
    }),
  ].join("");
}

function paraboloidDownShape({ cx, apexY, baseY, baseRx, baseRy, fill, stroke }) {
  const ringScales = [0.28, 0.52, 0.76];
  return [
    path(
      `M ${cx - baseRx} ${baseY} A ${baseRx} ${baseRy} 0 0 0 ${cx + baseRx} ${baseY} C ${cx + baseRx * 0.64} ${baseY - 60}, ${cx + 46} ${apexY + 30}, ${cx} ${apexY} C ${cx - 46} ${apexY + 30}, ${cx - baseRx * 0.64} ${baseY - 60}, ${cx - baseRx} ${baseY} Z`,
      {
        fill,
        stroke: "none",
      }
    ),
    ...ringScales.map((scale) =>
      ellipse(
        cx,
        apexY + (baseY - apexY) * scale * scale,
        baseRx * scale,
        Math.max(10, baseRy * scale),
        {
          fill: "none",
          stroke: COLORS.accentSoft,
          "stroke-width": 1.6,
        }
      )
    ),
    path(`M ${cx - baseRx} ${baseY} C ${cx - baseRx * 0.72} ${baseY - 60}, ${cx - 46} ${apexY + 30}, ${cx} ${apexY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    path(`M ${cx + baseRx} ${baseY} C ${cx + baseRx * 0.72} ${baseY - 60}, ${cx + 46} ${apexY + 30}, ${cx} ${apexY}`, {
      fill: "none",
      stroke,
      "stroke-width": 3,
      "stroke-linecap": "round",
    }),
    ellipse(cx, baseY, baseRx, baseRy, {
      fill: "none",
      stroke,
      "stroke-width": 3,
    }),
  ].join("");
}

function slantedPlane(points, attrs) {
  return polygon(points, attrs);
}

function callout(text, labelX, labelY, targetX, targetY, color) {
  return [
    line(labelX - 6, labelY + 4, targetX, targetY, {
      stroke: color,
      "stroke-width": 2,
      "stroke-dasharray": "5 5",
    }),
    textLabel(labelX, labelY, text, {
      fill: color,
      "font-size": 15,
      "font-weight": 700,
    }),
  ].join("");
}

function rect(x, y, width, height, attrs = {}) {
  return `<rect ${attrsToString({ x, y, width, height, ...attrs })} />`;
}

function circle(cx, cy, r, attrs = {}) {
  return `<circle ${attrsToString({ cx, cy, r, ...attrs })} />`;
}

function ellipse(cx, cy, rx, ry, attrs = {}) {
  return `<ellipse ${attrsToString({ cx, cy, rx, ry, ...attrs })} />`;
}

function line(x1, y1, x2, y2, attrs = {}) {
  return `<line ${attrsToString({ x1, y1, x2, y2, ...attrs })} />`;
}

function polygon(points, attrs = {}) {
  return `<polygon ${attrsToString({ points: pointsToString(points), ...attrs })} />`;
}

function path(d, attrs = {}) {
  return `<path ${attrsToString({ d, ...attrs })} />`;
}

function textLabel(x, y, text, attrs = {}) {
  return `<text ${attrsToString({ x, y, ...attrs })}>${escapeHtml(text)}</text>`;
}

function pathFromPoints(points, closed, attrs = {}) {
  const d = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  return path(closed ? `${d} Z` : d, attrs);
}

function pointsToString(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function attrsToString(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(" ");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
