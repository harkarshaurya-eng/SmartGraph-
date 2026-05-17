export const integralQuestions = Object.freeze([
  {
    id: "q1",
    label: "q1 - 2D bounded region",
    expression: "∫₀¹ ∫₀√(1+x²) 1/(1+x²+y²) dx dy",
    graphType: "boundedRegion2D",
    title: "2D bounded region",
    description:
      "Shows the region with 0≤x≤1 and 0≤y≤√(1+x²). The shaded area sits above the x-axis and below the curve y=√(1+x²).",
    region: "0≤x≤1, 0≤y≤√(1+x²)",
    drawSummary: "Axes, x=0, x=1, y=0, curve y=√(1+x²), shaded region under the curve.",
    annotations: {
      curveLabel: "y=√(1+x²)",
    },
  },
  {
    id: "q2",
    label: "q2 - Cone volume cut by z = 1",
    expression: "∭V √(x²+y²) dx dy dz",
    graphType: "coneVolume",
    title: "Cone volume",
    description:
      "Shows the cone x²+y²=z² with z>0, capped by the plane z=1. The highlighted solid is the finite cone volume between the apex and the cutting plane.",
    region: "x²+y²=z², z>0, cut by z=1",
    drawSummary: "Cone from the origin to the plane z=1, with the enclosed volume shaded.",
    annotations: {
      surfaceLabel: "x²+y²=z²",
      planeLabel: "z=1",
    },
  },
  {
    id: "q3",
    label: "q3 - Cylinder with paraboloid cap",
    expression: "∭V z² dx dy dz",
    graphType: "cylinderParaboloid",
    title: "Cylinder + paraboloid",
    description:
      "Shows the solid inside the cylinder x²+y²≤a², starting at z=0 and rising up to the paraboloid z=x²+y².",
    region: "Inside x²+y²≤a², between z=0 and z=x²+y²",
    drawSummary: "Cylinder wall, base plane z=0, paraboloid z=x²+y², shaded volume under the surface.",
    annotations: {
      wallLabel: "x²+y²=a²",
      surfaceLabel: "z=x²+y²",
      baseLabel: "z=0",
    },
  },
  {
    id: "q4",
    label: "q4 - Paraboloid cut by plane z = 3",
    expression: "∭V (x²+y²) dx dy dz",
    graphType: "paraboloidPlane",
    title: "Paraboloid + plane",
    description:
      "Shows the upward paraboloid x²+y²=3z capped by the horizontal plane z=3. The highlighted solid sits between the bowl and the plane.",
    region: "x²+y²=3z, cut by z=3",
    drawSummary: "Upward paraboloid, plane z=3, shaded volume, intersection circle x²+y²=9.",
    annotations: {
      surfaceLabel: "x²+y²=3z",
      planeLabel: "z=3",
      intersectionLabel: "x²+y²=9",
    },
  },
  {
    id: "q5",
    label: "q5 - Positive octant",
    expression: "∭V 1/(1+x²+y²+z²)² dx dy dz",
    graphType: "positiveOctant",
    title: "Positive octant",
    description:
      "Shows the first octant of 3D space, bounded only by the coordinate planes x=0, y=0, and z=0 while extending outward along all three positive axes.",
    region: "x≥0, y≥0, z≥0",
    drawSummary: "3D axes, shaded first octant, and infinity arrows along the positive directions.",
    annotations: {
      octantLabel: "x,y,z ≥ 0",
      limitLabel: "extends to ∞",
    },
  },
  {
    id: "q6",
    label: "q6 - Unit sphere in the positive octant",
    expression: "∭V 1/√(1-x²-y²-z²) dx dy dz",
    graphType: "sphereOctant",
    title: "Unit sphere positive octant",
    description:
      "Shows the one-eighth portion of the unit sphere that lies in the positive octant, together with the three coordinate planes that bound it.",
    region: "x²+y²+z²=1, x,y,z≥0",
    drawSummary: "One-eighth sphere, coordinate planes, and shaded interior volume.",
    annotations: {
      surfaceLabel: "x²+y²+z²=1",
      radiusLabel: "radius 1",
    },
  },
  {
    id: "q7",
    label: "q7 - Radius 2 sphere in the positive octant",
    expression: "∭V xyz dx dy dz",
    graphType: "sphereOctant",
    title: "Sphere positive octant radius 2",
    description:
      "Shows the one-eighth portion of the sphere x²+y²+z²=4 that sits in the positive octant.",
    region: "x²+y²+z²=4, x,y,z≥0",
    drawSummary: "One-eighth sphere of radius 2 with the bounded octant volume shaded.",
    annotations: {
      surfaceLabel: "x²+y²+z²=4",
      radiusLabel: "radius 2",
    },
  },
  {
    id: "q8",
    label: "q8 - Paraboloid cut by plane z = 4",
    expression: "Volume of x²+y²=4z cut by z=4",
    graphType: "paraboloidPlane",
    title: "Paraboloid cut by plane",
    description:
      "Shows the upward paraboloid z=(x²+y²)/4 capped by the plane z=4. The enclosed solid is shaded and its rim is the circle x²+y²=16.",
    region: "z=(x²+y²)/4, 0≤z≤4",
    drawSummary: "Upward paraboloid, plane z=4, shaded volume, intersection x²+y²=16.",
    annotations: {
      surfaceLabel: "x²+y²=4z",
      planeLabel: "z=4",
      intersectionLabel: "x²+y²=16",
    },
  },
  {
    id: "q9",
    label: "q9 - Downward paraboloid above the XY-plane",
    expression: "Volume bounded by z=4-x²-y² and z=0",
    graphType: "downwardParaboloid",
    title: "Downward paraboloid above XY-plane",
    description:
      "Shows the dome-shaped solid below z=4-x²-y² and above the plane z=0, with the circular base x²+y²≤4.",
    region: "0≤z≤4-x²-y², base x²+y²≤4",
    drawSummary: "Downward paraboloid, plane z=0, and the shaded volume over the circular base.",
    annotations: {
      surfaceLabel: "z=4-x²-y²",
      planeLabel: "z=0",
      baseLabel: "x²+y²≤4",
    },
  },
  {
    id: "q10",
    label: "q10 - Cone and paraboloid enclosure",
    expression: "Volume enclosed by z=√(x²+y²) and z=x²+y²",
    graphType: "coneParaboloid",
    title: "Cone + paraboloid",
    description:
      "Shows the volume enclosed between the cone z=r and the paraboloid z=r² for 0≤r≤1, meeting along the circle r=1.",
    region: "Between z=r and z=r², 0≤r≤1",
    drawSummary: "Cone, paraboloid, shared rim at r=1, and the enclosed volume shaded.",
    annotations: {
      coneLabel: "z=r",
      paraboloidLabel: "z=r²",
      intersectionLabel: "r=1",
    },
  },
  {
    id: "q11",
    label: "q11 - Paraboloid with slanted plane",
    expression: "Volume bounded by z=x²+y² and z=2x",
    graphType: "paraboloidSlantedPlane",
    title: "Paraboloid + slanted plane",
    description:
      "Shows the region between the upward paraboloid z=x²+y² and the slanted plane z=2x, over the circular base (x-1)²+y²≤1.",
    region: "Between z=x²+y² and z=2x, base (x-1)²+y²≤1",
    drawSummary: "Paraboloid, plane z=2x, base circle, and the bounded volume shaded.",
    annotations: {
      surfaceLabel: "z=x²+y²",
      planeLabel: "z=2x",
      baseLabel: "(x-1)²+y²≤1",
    },
  },
  {
    id: "q12",
    label: "q12 - Offset cylinder with paraboloid",
    expression: "Volume of cylinder x²+y²=2ax between x²+y²=2az and z=0",
    graphType: "offsetCylinderParaboloid",
    title: "Offset cylinder + paraboloid",
    description:
      "Shows the cylinder shifted along the positive x-direction, together with the base plane z=0 and the paraboloid z=(x²+y²)/(2a).",
    region: "Inside (x-a)²+y²≤a², 0≤z≤(x²+y²)/(2a)",
    drawSummary: "Offset cylinder, z=0, paraboloid, and the shaded enclosed volume.",
    annotations: {
      wallLabel: "(x-a)²+y²≤a²",
      surfaceLabel: "z=(x²+y²)/(2a)",
      baseLabel: "z=0",
    },
  },
  {
    id: "q13",
    label: "q13 - Shifted cylinder with paraboloid",
    expression: "Volume bounded by x²+y²=az, x²+y²=2ay, z=0",
    graphType: "shiftedCylinderParaboloid",
    title: "Shifted cylinder + paraboloid",
    description:
      "Shows the cylinder shifted along the positive y-direction, with the floor plane z=0 and the paraboloid z=(x²+y²)/a.",
    region: "Inside x²+(y-a)²≤a², 0≤z≤(x²+y²)/a",
    drawSummary: "Shifted cylinder, z=0, paraboloid, and the bounded volume shaded.",
    annotations: {
      wallLabel: "x²+(y-a)²≤a²",
      surfaceLabel: "z=(x²+y²)/a",
      baseLabel: "z=0",
    },
  },
  {
    id: "q14",
    label: "q14 - Sphere with paraboloid",
    expression: "Volume bounded by sphere x²+y²+z²=4 and paraboloid x²+y²=3z",
    graphType: "sphereParaboloid",
    title: "Sphere + paraboloid",
    description:
      "Shows the sphere of radius 2 together with the upward paraboloid x²+y²=3z. Their bounded overlap is highlighted, and the intersection circle occurs at z=1, r=√3.",
    region: "Bounded by x²+y²+z²=4 and x²+y²=3z",
    drawSummary: "Sphere radius 2, paraboloid, highlighted bounded region, and intersection circle at z=1.",
    annotations: {
      sphereLabel: "x²+y²+z²=4",
      paraboloidLabel: "x²+y²=3z",
      intersectionLabel: "z=1, r=√3",
    },
  },
  {
    id: "q15",
    label: "q15 - Cylinder with slanted plane y+z=4",
    expression: "Volume bounded by cylinder x²+y²=4 and planes y+z=4, z=0",
    graphType: "cylinderSlantedPlane",
    title: "Cylinder + slanted plane",
    description:
      "Shows the cylinder x²+y²=4 resting on z=0, with the plane z=4-y slicing across the top of the solid.",
    region: "Inside x²+y²≤4, 0≤z≤4-y",
    drawSummary: "Cylinder radius 2, plane z=4-y, bottom z=0, and the shaded bounded volume.",
    annotations: {
      wallLabel: "x²+y²=4",
      planeLabel: "z=4-y",
      baseLabel: "z=0",
    },
  },
  {
    id: "q16",
    label: "q16 - Parabolic base with slanted top plane",
    expression: "Volume bounded by y²=x, x²=y, z=0, x+y+z=2",
    graphType: "parabolicBasePlane",
    title: "Parabolic base + slanted plane",
    description:
      "Shows the base region enclosed by y²=x and x²=y, extruded vertically until it meets the plane z=2-x-y.",
    region: "Base between y²=x and x²=y, with 0≤z≤2-x-y",
    drawSummary: "Parabolic base region, vertical walls, top plane z=2-x-y, and shaded enclosed volume.",
    annotations: {
      curveALabel: "y²=x",
      curveBLabel: "x²=y",
      planeLabel: "z=2-x-y",
      intersectionLabel: "(0,0), (1,1)",
    },
  },
  {
    id: "q17",
    label: "q17 - Tetrahedron under x/a + y/b + z/c = 1",
    expression: "Tetrahedron bounded by coordinate planes and x/a+y/b+z/c=1",
    graphType: "tetrahedron",
    title: "Tetrahedron",
    description:
      "Shows the tetrahedron in the first octant bounded by the coordinate planes and the intercept form plane x/a + y/b + z/c = 1.",
    region: "x,y,z≥0 under x/a+y/b+z/c=1",
    drawSummary: "Axes, intercepts a, b, c, the triangular plane, and the shaded tetrahedral volume.",
    annotations: {
      planeLabel: "x/a+y/b+z/c=1",
      interceptsLabel: "Intercepts: a, b, c",
    },
  },
]);
