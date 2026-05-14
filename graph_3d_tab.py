"""Tkinter launcher tab for the advanced Three.js 3D Graph workspace."""

from __future__ import annotations

import functools
import http.server
import socket
import socketserver
import threading
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import ttk


class QuietStaticHandler(http.server.SimpleHTTPRequestHandler):
    """Serve local files quietly and disable browser caching."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        """Silence HTTP request logs in the desktop app."""
        return


class Graph3DTab(tk.Frame):
    """Provide a desktop entry point into the Three.js 3D Graph Studio."""

    def __init__(self, parent: ttk.Notebook) -> None:
        super().__init__(parent, bg="#ffffff")
        self.server: socketserver.TCPServer | None = None
        self.server_thread: threading.Thread | None = None
        self.server_port: int | None = None
        self.status_var = tk.StringVar(value="3D Graph Studio is ready to launch.")
        self.url_var = tk.StringVar(value="URL will appear here after the local server starts.")
        self.project_root = Path(__file__).resolve().parent
        self.web_entry = self.project_root / "src" / "3d-graph" / "UI3DPanel.html"

        self.build_ui()

    def build_ui(self) -> None:
        """Create the 3D Graph launcher interface."""
        outer_frame = tk.Frame(self, bg="#ffffff", padx=20, pady=20)
        outer_frame.pack(fill="both", expand=True)

        heading = tk.Label(
            outer_frame,
            text="3D Graph Studio",
            font=("Arial", 16, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        heading.pack(anchor="w")

        intro = tk.Label(
            outer_frame,
            text=(
                "SmartGraph now ships with a full browser-powered Three.js workspace for 3D plotting, shading, "
                "and triple-integration visualization. Launch it below to open the interactive studio."
            ),
            font=("Arial", 11),
            bg="#ffffff",
            fg="#4a5c6d",
            justify="left",
            wraplength=940,
        )
        intro.pack(anchor="w", pady=(8, 18))

        button_frame = tk.Frame(outer_frame, bg="#ffffff")
        button_frame.pack(anchor="w", pady=(0, 14))

        self.create_action_button(
            button_frame,
            text="Open 3D Graph",
            command=self.open_graph,
        ).pack(side="left")

        self.create_action_button(
            button_frame,
            text="Copy Link",
            command=self.copy_link,
        ).pack(side="left", padx=(10, 0))

        self.create_action_button(
            button_frame,
            text="Restart Server",
            command=self.restart_server,
        ).pack(side="left", padx=(10, 0))

        status_label = tk.Label(
            outer_frame,
            textvariable=self.status_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#1d6f42",
            anchor="w",
            justify="left",
            wraplength=940,
        )
        status_label.pack(fill="x", pady=(0, 10))
        self.status_label = status_label

        link_frame = tk.Frame(outer_frame, bg="#ffffff")
        link_frame.pack(fill="x", pady=(0, 18))

        tk.Label(
            link_frame,
            text="Local 3D Graph URL",
            font=("Arial", 11, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        ).pack(anchor="w")

        tk.Entry(
            link_frame,
            textvariable=self.url_var,
            font=("Consolas", 10),
            width=90,
            state="readonly",
            readonlybackground="#f8fbff",
        ).pack(fill="x", pady=(6, 0))

        features_frame = tk.Frame(outer_frame, bg="#ffffff")
        features_frame.pack(fill="both", expand=True)

        tk.Label(
            features_frame,
            text="Included 3D Graph Features",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        ).pack(anchor="w")

        features = (
            "• Fixed origin with orbit camera, axis ticks, labels, and toggleable XY/XZ/YZ grids\n"
            "• Draw tools for points, lines, arrows, parametric curves, surfaces, implicit surfaces, and polygons\n"
            "• Shade tools for gaps between surfaces, inequality volumes, curtains, and planar polygon regions\n"
            "• Triple-integral worker using composite Simpson's rule with progress, presets, region meshes, and slice animation\n"
            "• Object Manager with visibility toggles, recoloring, deletion, Clear All, FPS, and PNG export"
        )

        tk.Label(
            features_frame,
            text=features,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#3d5166",
            justify="left",
            anchor="nw",
        ).pack(anchor="w", pady=(8, 0))

    def create_action_button(self, parent: tk.Widget, text: str, command) -> tk.Button:
        """Create a blue SmartGraph button."""
        return tk.Button(
            parent,
            text=text,
            command=command,
            font=("Arial", 10, "bold"),
            bg="#2d6cdf",
            fg="white",
            activebackground="#1e56b3",
            activeforeground="white",
            relief="flat",
            padx=14,
            pady=8,
            cursor="hand2",
        )

    def open_graph(self) -> None:
        """Start the local server if needed and open the 3D Graph in the browser."""
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        webbrowser.open(url)
        self.set_status("3D Graph Studio opened in your browser.", is_error=False)

    def copy_link(self) -> None:
        """Copy the local 3D Graph URL to the clipboard."""
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        self.clipboard_clear()
        self.clipboard_append(url)
        self.update()
        self.set_status("3D Graph URL copied to the clipboard.", is_error=False)

    def restart_server(self) -> None:
        """Restart the local HTTP server for the web-based 3D Graph."""
        self.stop_server()
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        self.set_status(f"3D Graph server restarted at {url}", is_error=False)

    def ensure_server(self) -> str:
        """Start the local HTTP server if it is not already running."""
        if not self.web_entry.exists():
            raise FileNotFoundError("The 3D Graph web entry file was not found in src/3d-graph/UI3DPanel.html.")

        if self.server is not None and self.server_thread is not None and self.server_thread.is_alive():
            return self.build_url()

        self.server_port = self.find_free_port()
        handler = functools.partial(QuietStaticHandler, directory=str(self.project_root))
        self.server = socketserver.ThreadingTCPServer(("127.0.0.1", self.server_port), handler)
        self.server.daemon_threads = True
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        url = self.build_url()
        self.url_var.set(url)
        return url

    def stop_server(self) -> None:
        """Stop the local HTTP server if it is running."""
        if self.server is not None:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
        self.server_thread = None
        self.server_port = None
        self.url_var.set("URL will appear here after the local server starts.")

    def build_url(self) -> str:
        """Build the browser URL for the 3D Graph entry point."""
        if self.server_port is None:
            raise RuntimeError("The 3D Graph server has not been started yet.")
        return f"http://127.0.0.1:{self.server_port}/src/3d-graph/UI3DPanel.html"

    def find_free_port(self) -> int:
        """Find an available local TCP port."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.listen(1)
            return int(sock.getsockname()[1])

    def set_status(self, message: str, is_error: bool) -> None:
        """Show a green or red status message."""
        self.status_var.set(message)
        self.status_label.config(fg="#b42318" if is_error else "#1d6f42")
