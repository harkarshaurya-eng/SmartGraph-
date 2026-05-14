# SmartGraph

SmartGraph is a Python desktop app for visual calculus and 3D graph exploration. The desktop side uses Tkinter for double and triple integration tools, while the advanced 3D graph studio is powered by a local Three.js workspace launched from the `3D Graph` tab.

## Run the app

```bash
git clone https://github.com/harkarshaurya-eng/SmartGraph-.git
cd SmartGraph-
pip install -r requirements.txt
python main.py
```

## Main features

- Double integration with symbolic steps and adaptive region previews
- Triple integration with symbolic steps and variable-limit validation
- Browser-powered 3D graph studio launched from SmartGraph's `3D Graph` tab

## 3D Graph Feature

The `3D Graph` tab launches a full Three.js workspace served locally from `src/3d-graph/`.

Included tools:

- Fixed-origin 3D coordinate system with orbit camera, axis ticks, floating labels, and toggleable XY/XZ/YZ grids
- Draw panel for points, line segments, vector arrows, parametric curves, surface plots, implicit surfaces, and planar polygons
- Shade panel for regions between two surfaces, inequality volumes, curtain surfaces under a curve, and planar polygon regions
- Triple-integral visualizer with preset examples, worker-based composite Simpson's rule, progress updates, region shading, and animated slices
- Object Manager with visibility toggles, recoloring, deletion, Clear All, FPS display, and PNG export

## Project structure

Desktop app:

- `main.py`
- `graph_app.py`
- `integration_tab.py`
- `integration_utils.py`
- `graph_3d_tab.py`

3D graph studio:

- `src/3d-graph/ThreeDGraph.js`
- `src/3d-graph/DrawTool.js`
- `src/3d-graph/ShadeTool.js`
- `src/3d-graph/TripleIntegral.js`
- `src/3d-graph/TripleIntegralWorker.js`
- `src/3d-graph/MarchingCubes.js`
- `src/3d-graph/ExpressionParser.js`
- `src/3d-graph/ObjectManager.js`
- `src/3d-graph/UI3DPanel.html`
- `src/3d-graph/styles3d.css`
