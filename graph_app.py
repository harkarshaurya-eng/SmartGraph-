"""Main window for the SmartGraph desktop application."""

from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from graph_3d_tab import Graph3DTab
from integral_graph_tab import IntegralGraphTab
from integration_tab import DoubleIntegrationTab, TripleIntegrationTab


class SmartGraphApp:
    """Build and manage the main SmartGraph window."""

    APP_TITLE = "SmartGraph"

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(self.APP_TITLE)
        self.root.minsize(1260, 900)
        self.root.configure(bg="#f5f7fb")

        self.configure_styles()
        self.build_ui()

    def configure_styles(self) -> None:
        """Set ttk styles used by the notebook tabs."""
        style = ttk.Style(self.root)
        style.theme_use("clam")
        style.configure("SmartGraph.TNotebook", background="#f5f7fb", borderwidth=0)
        style.configure(
            "SmartGraph.TNotebook.Tab",
            padding=(16, 10),
            font=("Arial", 11, "bold"),
        )
        style.map(
            "SmartGraph.TNotebook.Tab",
            background=[("selected", "#ffffff"), ("!selected", "#dfe7f2")],
        )

    def build_ui(self) -> None:
        """Create the heading and tabbed layout."""
        main_frame = tk.Frame(self.root, bg="#f5f7fb", padx=18, pady=18)
        main_frame.pack(fill="both", expand=True)

        heading = tk.Label(
            main_frame,
            text="SmartGraph - Adaptive Integration Graphs, Integral Visuals, and Advanced 3D Graph Studio",
            font=("Arial", 18, "bold"),
            bg="#f5f7fb",
            fg="#1f2d3d",
        )
        heading.pack(anchor="w")

        subtitle = tk.Label(
            main_frame,
            text=(
                "Use variable bounds in the calculus tabs to preview the actual region from your limits, "
                "open the Integral Graph Visualiser for preset SVG study diagrams, or launch the 3D Graph tab "
                "for the full Three.js workspace for drawing, shading, and triple integration."
            ),
            font=("Arial", 11),
            bg="#f5f7fb",
            fg="#41576d",
        )
        subtitle.pack(anchor="w", pady=(6, 14))

        notebook = ttk.Notebook(main_frame, style="SmartGraph.TNotebook")
        notebook.pack(fill="both", expand=True)

        double_tab = DoubleIntegrationTab(notebook)
        triple_tab = TripleIntegrationTab(notebook)
        integral_graph_tab = IntegralGraphTab(notebook)
        graph_3d_tab = Graph3DTab(notebook)

        notebook.add(double_tab, text="Double Integration")
        notebook.add(triple_tab, text="Triple Integration")
        notebook.add(integral_graph_tab, text="Integral Graph Visualiser")
        notebook.add(graph_3d_tab, text="3D Graph")

        def on_tab_changed(event: tk.Event) -> None:
            selected_widget = notebook.nametowidget(notebook.select())
            if selected_widget == integral_graph_tab:
                integral_graph_tab.handle_selected()
            elif selected_widget == graph_3d_tab:
                graph_3d_tab.handle_selected()

        notebook.bind("<<NotebookTabChanged>>", on_tab_changed)
