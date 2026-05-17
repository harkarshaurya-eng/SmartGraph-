"""Tkinter-integrated launcher tab for the SmartGraph Integral Graph Visualiser."""

from __future__ import annotations

import functools
import http.server
import socket
import socketserver
import subprocess
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


class IntegralGraphTab(tk.Frame):
    """Keep the integral graph visualiser tied into the SmartGraph desktop flow."""

    APP_WINDOW_TITLE = "SmartGraph Integral Graph Visualiser"

    def __init__(self, parent: ttk.Notebook) -> None:
        super().__init__(parent, bg="#ffffff")
        self.server: socketserver.TCPServer | None = None
        self.server_thread: threading.Thread | None = None
        self.server_port: int | None = None
        self.browser_process: subprocess.Popen | None = None
        self.auto_launch_done = False

        self.project_root = Path(__file__).resolve().parent
        self.web_entry = self.project_root / "src" / "integral-graph" / "UIIntegralGraph.html"
        self.browser_executable = self.find_browser_executable()

        self.status_var = tk.StringVar(
            value="The integral graph visualiser will open automatically when you select this tab."
        )
        self.url_var = tk.StringVar(value="URL will appear here after the local server starts.")
        self.mode_var = tk.StringVar(value=self.build_mode_text())

        self.build_ui()
        self.bind("<Destroy>", self.on_destroy, add="+")

    def build_ui(self) -> None:
        """Create the integrated integral graph launcher interface."""
        outer_frame = tk.Frame(self, bg="#ffffff", padx=20, pady=20)
        outer_frame.pack(fill="both", expand=True)

        heading = tk.Label(
            outer_frame,
            text="Integral Graph Visualiser",
            font=("Arial", 16, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        heading.pack(anchor="w")

        intro = tk.Label(
            outer_frame,
            text=(
                "This tab opens a dedicated SmartGraph visual study page for preset integral regions and volumes. "
                "Choose a question from the dropdown, then inspect the matching hard-coded SVG diagram without "
                "running symbolic integration."
            ),
            font=("Arial", 11),
            bg="#ffffff",
            fg="#4a5c6d",
            justify="left",
            wraplength=960,
        )
        intro.pack(anchor="w", pady=(8, 16))

        mode_label = tk.Label(
            outer_frame,
            textvariable=self.mode_var,
            font=("Arial", 10, "italic"),
            bg="#ffffff",
            fg="#52667a",
            justify="left",
            wraplength=960,
        )
        mode_label.pack(anchor="w", pady=(0, 14))

        button_frame = tk.Frame(outer_frame, bg="#ffffff")
        button_frame.pack(anchor="w", pady=(0, 14))

        self.create_action_button(
            button_frame,
            text="Open / Focus Visualiser",
            command=self.open_or_focus_visualiser,
        ).pack(side="left")

        self.create_action_button(
            button_frame,
            text="Open in Browser",
            command=self.open_in_browser,
        ).pack(side="left", padx=(10, 0))

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

        self.create_action_button(
            button_frame,
            text="Close Visualiser",
            command=self.close_visualiser_window,
        ).pack(side="left", padx=(10, 0))

        status_label = tk.Label(
            outer_frame,
            textvariable=self.status_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#1d6f42",
            anchor="w",
            justify="left",
            wraplength=960,
        )
        status_label.pack(fill="x", pady=(0, 10))
        self.status_label = status_label

        link_frame = tk.Frame(outer_frame, bg="#ffffff")
        link_frame.pack(fill="x", pady=(0, 18))

        tk.Label(
            link_frame,
            text="Local Integral Graph URL",
            font=("Arial", 11, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        ).pack(anchor="w")

        tk.Entry(
            link_frame,
            textvariable=self.url_var,
            font=("Consolas", 10),
            width=92,
            state="readonly",
            readonlybackground="#f8fbff",
        ).pack(fill="x", pady=(6, 0))

        info_frame = tk.Frame(outer_frame, bg="#ffffff")
        info_frame.pack(fill="both", expand=True)

        tk.Label(
            info_frame,
            text="What You Get In The Visualiser",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        ).pack(anchor="w")

        features = (
            "• A dedicated 'Integral Graph Visualiser' study page with a dropdown of preset questions\n"
            "• Hard-coded SVG diagrams for bounded 2D regions, cones, cylinders, paraboloids, spheres, planes, and tetrahedra\n"
            "• Selected expression, region description, draw notes, and a reset button for quick comparisons\n"
            "• Responsive layout so the preview stays readable on narrower screens as well\n\n"
            "If the visualiser window is behind another app, press 'Open / Focus Visualiser' again."
        )

        tk.Label(
            info_frame,
            text=features,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#3d5166",
            justify="left",
            anchor="nw",
        ).pack(anchor="w", pady=(8, 0))

    def create_action_button(self, parent: tk.Widget, text: str, command) -> tk.Button:
        """Create a blue SmartGraph action button."""
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

    def handle_selected(self) -> None:
        """Launch the visualiser the first time the tab is selected, then focus it later."""
        if not self.auto_launch_done:
            self.auto_launch_done = True
            self.open_or_focus_visualiser()
            return

        if self.browser_process is not None and self.browser_process.poll() is None:
            self.focus_visualiser_window()

    def open_or_focus_visualiser(self) -> None:
        """Open the visualiser as an app-style window or focus the existing one."""
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        if self.browser_process is not None and self.browser_process.poll() is None:
            if self.focus_visualiser_window():
                self.set_status("Focused the existing integral graph visualiser window.", is_error=False)
                return

        self.launch_visualiser_window(url)

    def open_in_browser(self) -> None:
        """Open the visualiser URL in the default browser as a fallback."""
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        webbrowser.open(url)
        self.set_status("Opened the integral graph visualiser in your default browser.", is_error=False)

    def copy_link(self) -> None:
        """Copy the visualiser URL to the clipboard."""
        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        self.clipboard_clear()
        self.clipboard_append(url)
        self.update()
        self.set_status("Integral graph visualiser URL copied to the clipboard.", is_error=False)

    def restart_server(self) -> None:
        """Restart the local HTTP server and reopen the visualiser window if needed."""
        was_open = self.browser_process is not None and self.browser_process.poll() is None
        self.close_visualiser_window()
        self.stop_server()

        try:
            url = self.ensure_server()
        except FileNotFoundError as error:
            self.set_status(str(error), is_error=True)
            return

        if was_open:
            self.launch_visualiser_window(url)
            return

        self.set_status(f"Integral graph server restarted at {url}", is_error=False)

    def close_visualiser_window(self) -> None:
        """Close the app-style visualiser window if SmartGraph launched it."""
        if self.browser_process is not None and self.browser_process.poll() is None:
            self.browser_process.terminate()
            try:
                self.browser_process.wait(timeout=4)
            except subprocess.TimeoutExpired:
                self.browser_process.kill()
        self.browser_process = None
        self.set_status("Closed the integral graph visualiser window.", is_error=False)

    def ensure_server(self) -> str:
        """Start the local HTTP server if it is not already running."""
        if not self.web_entry.exists():
            raise FileNotFoundError(
                "The integral graph visualiser entry file was not found in src/integral-graph/UIIntegralGraph.html."
            )

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

    def launch_visualiser_window(self, url: str) -> None:
        """Launch the visualiser in an app-style browser window or a normal browser fallback."""
        if self.browser_executable is None:
            webbrowser.open(url)
            self.set_status(
                "No Edge/Chrome app-mode browser was found, so SmartGraph opened the integral graph visualiser in your default browser.",
                is_error=False,
            )
            return

        command = [
            str(self.browser_executable),
            f"--app={url}",
            "--window-size=1440,980",
            "--disable-session-crashed-bubble",
            "--disable-features=Translate,msWebOOUI,msPdfOOUI",
        ]
        self.browser_process = subprocess.Popen(command)
        self.set_status("Opened the integral graph visualiser as an app-style window connected to SmartGraph.", is_error=False)

    def focus_visualiser_window(self) -> bool:
        """Try to bring the visualiser window to the front on Windows."""
        powershell_script = (
            "$wshell = New-Object -ComObject WScript.Shell; "
            f"$result = $wshell.AppActivate('{self.APP_WINDOW_TITLE}'); "
            "if ($result) { Write-Output 'focused' } else { Write-Output 'not-found' }"
        )
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-Command", powershell_script],
            capture_output=True,
            text=True,
            check=False,
        )
        return "focused" in completed.stdout

    def build_url(self) -> str:
        """Build the browser URL for the visualiser entry point."""
        if self.server_port is None:
            raise RuntimeError("The integral graph server has not been started yet.")
        return f"http://127.0.0.1:{self.server_port}/src/integral-graph/UIIntegralGraph.html"

    def find_free_port(self) -> int:
        """Find an available local TCP port."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            sock.listen(1)
            return int(sock.getsockname()[1])

    def find_browser_executable(self) -> Path | None:
        """Return a local browser executable that supports app mode."""
        candidate_paths = (
            Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        )
        for candidate_path in candidate_paths:
            if candidate_path.exists():
                return candidate_path
        return None

    def build_mode_text(self) -> str:
        """Describe how SmartGraph will open the visualiser."""
        if self.browser_executable is None:
            return "SmartGraph will use your default browser because no local Edge/Chrome app-mode executable was found."
        return (
            f"SmartGraph found {self.browser_executable.name} and will launch the integral graph visualiser as an app-style window "
            "when you use this tab."
        )

    def on_destroy(self, event: tk.Event) -> None:
        """Clean up the launched visualiser window and local server when the tab is destroyed."""
        if event.widget is not self:
            return
        if self.browser_process is not None and self.browser_process.poll() is None:
            self.browser_process.terminate()
        self.stop_server()

    def set_status(self, message: str, is_error: bool) -> None:
        """Show a green or red status message."""
        self.status_var.set(message)
        self.status_label.config(fg="#b42318" if is_error else "#1d6f42")
