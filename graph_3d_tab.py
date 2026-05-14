"""Interactive 3D graph tab for SmartGraph."""

from __future__ import annotations

import math
import re
import tkinter as tk
from tkinter import ttk


class Graph3DTab(tk.Frame):
    """Interactive 3D graph workspace with draw and shade tools."""

    CANVAS_WIDTH = 760
    CANVAS_HEIGHT = 640
    AXIS_EXTENT = 5.0
    CAMERA_DISTANCE = 14.0
    BASE_SCALE = 38.0

    def __init__(self, parent: ttk.Notebook) -> None:
        super().__init__(parent, bg="#ffffff")

        self.draw_mode_var = tk.StringVar(value="Dot")
        self.draw_coords_var = tk.StringVar(value="1, 2, 3")
        self.draw_color_var = tk.StringVar(value="#1e63d6")
        self.shade_coords_var = tk.StringVar(value="0,0,0; 2,0,0; 2,2,0; 0,2,0")
        self.shade_color_var = tk.StringVar(value="#9ec5fe")
        self.status_var = tk.StringVar(value="")
        self.scene_info_var = tk.StringVar(value="")

        self.angle_x = -0.45
        self.angle_y = 0.65
        self.scene_objects: list[dict[str, object]] = []
        self.last_mouse_position: tuple[int, int] | None = None

        self.build_ui()
        self.render_scene()
        self.update_scene_info()

    def build_ui(self) -> None:
        """Create the 3D graph interface."""
        outer_frame = tk.Frame(self, bg="#ffffff", padx=16, pady=16)
        outer_frame.pack(fill="both", expand=True)

        heading = tk.Label(
            outer_frame,
            text="3D Graph Workspace",
            font=("Arial", 15, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        heading.pack(anchor="w")

        intro = tk.Label(
            outer_frame,
            text=(
                "Draw 3D dots, lines, or paths, shade polygon faces from coordinates, and drag on the canvas "
                "to rotate the view around the fixed origin (0, 0, 0)."
            ),
            font=("Arial", 10),
            bg="#ffffff",
            fg="#4a5c6d",
            justify="left",
            wraplength=1020,
        )
        intro.pack(anchor="w", pady=(6, 14))

        content_frame = tk.Frame(outer_frame, bg="#ffffff")
        content_frame.pack(fill="both", expand=True)

        left_panel = tk.Frame(content_frame, bg="#ffffff", width=420)
        left_panel.pack(side="left", fill="y", padx=(0, 18))
        left_panel.pack_propagate(False)

        right_panel = tk.Frame(content_frame, bg="#ffffff")
        right_panel.pack(side="left", fill="both", expand=True)

        self.build_draw_section(left_panel)
        self.build_shade_section(left_panel)
        self.build_controls_section(left_panel)

        scene_title = tk.Label(
            left_panel,
            text="Scene Info",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        scene_title.pack(anchor="w", pady=(14, 6))

        scene_label = tk.Label(
            left_panel,
            textvariable=self.scene_info_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#3d5166",
            justify="left",
            anchor="nw",
            wraplength=390,
        )
        scene_label.pack(fill="x")

        status_label = tk.Label(
            left_panel,
            textvariable=self.status_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#1d6f42",
            justify="left",
            anchor="w",
            wraplength=390,
        )
        status_label.pack(fill="x", pady=(12, 0))
        self.status_label = status_label

        canvas_title = tk.Label(
            right_panel,
            text="3D View",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        canvas_title.pack(anchor="w")

        self.canvas = tk.Canvas(
            right_panel,
            width=self.CANVAS_WIDTH,
            height=self.CANVAS_HEIGHT,
            bg="#fbfdff",
            highlightthickness=1,
            highlightbackground="#c9d1d9",
        )
        self.canvas.pack(fill="both", expand=True, pady=(8, 0))
        self.canvas.bind("<ButtonPress-1>", self.on_mouse_press)
        self.canvas.bind("<B1-Motion>", self.on_mouse_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_mouse_release)

    def build_draw_section(self, parent: tk.Frame) -> None:
        """Create the draw section for dots, lines, and paths."""
        section_title = tk.Label(
            parent,
            text="Draw Objects",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        section_title.pack(anchor="w")

        section_frame = tk.Frame(parent, bg="#ffffff")
        section_frame.pack(fill="x", pady=(8, 0))

        tk.Label(section_frame, text="Object type", font=("Arial", 11), bg="#ffffff").grid(
            row=0, column=0, sticky="w", pady=4, padx=(0, 10)
        )
        draw_mode_combo = ttk.Combobox(
            section_frame,
            values=("Dot", "Line", "Path"),
            textvariable=self.draw_mode_var,
            state="readonly",
            width=25,
            font=("Arial", 11),
        )
        draw_mode_combo.grid(row=0, column=1, sticky="w", pady=4)

        tk.Label(section_frame, text="Coordinates", font=("Arial", 11), bg="#ffffff").grid(
            row=1, column=0, sticky="w", pady=4, padx=(0, 10)
        )
        draw_entry = tk.Entry(section_frame, textvariable=self.draw_coords_var, font=("Arial", 11), width=28)
        draw_entry.grid(row=1, column=1, sticky="w", pady=4)

        tk.Label(section_frame, text="Color", font=("Arial", 11), bg="#ffffff").grid(
            row=2, column=0, sticky="w", pady=4, padx=(0, 10)
        )
        color_entry = tk.Entry(section_frame, textvariable=self.draw_color_var, font=("Arial", 11), width=28)
        color_entry.grid(row=2, column=1, sticky="w", pady=4)

        draw_help = tk.Label(
            section_frame,
            text=(
                "Dot example: 1, 2, 3\n"
                "Line example: 0,0,0; 3,2,1\n"
                "Path example: 0,0,0; 2,1,0; 3,1,2"
            ),
            font=("Arial", 9),
            bg="#ffffff",
            fg="#52667a",
            justify="left",
        )
        draw_help.grid(row=3, column=0, columnspan=2, sticky="w", pady=(6, 0))

    def build_shade_section(self, parent: tk.Frame) -> None:
        """Create the shade section for polygon faces."""
        section_title = tk.Label(
            parent,
            text="Shade Polygon",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        section_title.pack(anchor="w", pady=(16, 0))

        section_frame = tk.Frame(parent, bg="#ffffff")
        section_frame.pack(fill="x", pady=(8, 0))

        tk.Label(section_frame, text="Vertices", font=("Arial", 11), bg="#ffffff").grid(
            row=0, column=0, sticky="w", pady=4, padx=(0, 10)
        )
        shade_entry = tk.Entry(section_frame, textvariable=self.shade_coords_var, font=("Arial", 11), width=28)
        shade_entry.grid(row=0, column=1, sticky="w", pady=4)

        tk.Label(section_frame, text="Color", font=("Arial", 11), bg="#ffffff").grid(
            row=1, column=0, sticky="w", pady=4, padx=(0, 10)
        )
        shade_color_entry = tk.Entry(
            section_frame,
            textvariable=self.shade_color_var,
            font=("Arial", 11),
            width=28,
        )
        shade_color_entry.grid(row=1, column=1, sticky="w", pady=4)

        shade_help = tk.Label(
            section_frame,
            text="Example: 0,0,0; 2,0,0; 2,2,0; 0,2,0",
            font=("Arial", 9),
            bg="#ffffff",
            fg="#52667a",
            justify="left",
        )
        shade_help.grid(row=2, column=0, columnspan=2, sticky="w", pady=(6, 0))

    def build_controls_section(self, parent: tk.Frame) -> None:
        """Create the action buttons."""
        button_frame = tk.Frame(parent, bg="#ffffff")
        button_frame.pack(fill="x", pady=(16, 0))

        draw_button = self.create_action_button(
            button_frame,
            text="Draw",
            command=self.add_draw_object,
        )
        draw_button.pack(side="left")

        shade_button = self.create_action_button(
            button_frame,
            text="Shade",
            command=self.add_shaded_polygon,
        )
        shade_button.pack(side="left", padx=(10, 0))

        clear_button = self.create_action_button(
            button_frame,
            text="Clear Scene",
            command=self.clear_scene,
        )
        clear_button.pack(side="left", padx=(10, 0))

        reset_button = self.create_action_button(
            button_frame,
            text="Reset View",
            command=self.reset_view,
        )
        reset_button.pack(side="left", padx=(10, 0))

    def create_action_button(
        self,
        parent: tk.Widget,
        text: str,
        command,
    ) -> tk.Button:
        """Create a blue action button."""
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

    def add_draw_object(self) -> None:
        """Add a dot, line, or path to the scene."""
        object_type = self.draw_mode_var.get()
        color = self.draw_color_var.get().strip() or "#1e63d6"

        try:
            self.validate_color(color)
            points = self.parse_points(self.draw_coords_var.get())
            if object_type == "Dot" and len(points) != 1:
                raise ValueError("For a dot, enter exactly one coordinate such as 1, 2, 3.")
            if object_type == "Line" and len(points) != 2:
                raise ValueError("For a line, enter exactly two coordinates such as 0,0,0; 3,2,1.")
            if object_type == "Path" and len(points) < 2:
                raise ValueError("For a path, enter at least two coordinates such as 0,0,0; 2,1,0; 3,1,2.")
        except ValueError as error:
            self.set_status(str(error), is_error=True)
            return

        self.scene_objects.append(
            {
                "type": "point" if object_type == "Dot" else object_type.lower(),
                "points": points,
                "color": color,
            }
        )
        self.render_scene()
        self.update_scene_info()
        self.set_status(f"{object_type} added to the 3D graph.", is_error=False)

    def add_shaded_polygon(self) -> None:
        """Add a shaded polygon face to the scene."""
        color = self.shade_color_var.get().strip() or "#9ec5fe"

        try:
            self.validate_color(color)
            points = self.parse_points(self.shade_coords_var.get())
            if len(points) < 3:
                raise ValueError(
                    "To shade a face, enter at least three vertices such as 0,0,0; 2,0,0; 2,2,0."
                )
        except ValueError as error:
            self.set_status(str(error), is_error=True)
            return

        self.scene_objects.append(
            {
                "type": "polygon",
                "points": points,
                "color": color,
            }
        )
        self.render_scene()
        self.update_scene_info()
        self.set_status("Shaded polygon added to the 3D graph.", is_error=False)

    def clear_scene(self) -> None:
        """Remove all objects from the 3D scene."""
        self.scene_objects = []
        self.render_scene()
        self.update_scene_info()
        self.set_status("3D scene cleared.", is_error=False)

    def reset_view(self) -> None:
        """Reset the 3D viewing angle."""
        self.angle_x = -0.45
        self.angle_y = 0.65
        self.render_scene()
        self.set_status("3D view reset around the fixed origin.", is_error=False)

    def parse_points(self, raw_text: str) -> list[tuple[float, float, float]]:
        """Parse semicolon-separated 3D coordinates."""
        cleaned_text = raw_text.strip()
        if not cleaned_text:
            raise ValueError("Please enter coordinates first.")

        point_texts = [item.strip() for item in cleaned_text.split(";") if item.strip()]
        points: list[tuple[float, float, float]] = []

        for point_text in point_texts:
            values = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", point_text)
            if len(values) != 3:
                raise ValueError("Each 3D coordinate must have exactly three values: x, y, z.")
            points.append((float(values[0]), float(values[1]), float(values[2])))

        return points

    def validate_color(self, color: str) -> None:
        """Check that a Tkinter color string is valid."""
        try:
            self.winfo_rgb(color)
        except tk.TclError:
            raise ValueError(
                "Please enter a valid color such as blue or #9ec5fe."
            ) from None

    def on_mouse_press(self, event: tk.Event) -> None:
        """Start rotating the view."""
        self.last_mouse_position = (event.x, event.y)

    def on_mouse_drag(self, event: tk.Event) -> None:
        """Rotate the view around the fixed origin."""
        if self.last_mouse_position is None:
            return

        last_x, last_y = self.last_mouse_position
        dx = event.x - last_x
        dy = event.y - last_y
        self.angle_y += dx * 0.01
        self.angle_x += dy * 0.01
        self.last_mouse_position = (event.x, event.y)
        self.render_scene()

    def on_mouse_release(self, event: tk.Event) -> None:
        """Finish rotating the view."""
        self.last_mouse_position = None

    def render_scene(self) -> None:
        """Redraw the full 3D scene."""
        self.canvas.delete("all")
        self.draw_background_grid()

        projected_origin = self.project_point((0.0, 0.0, 0.0))
        axes = [
            ((-self.AXIS_EXTENT, 0.0, 0.0), (self.AXIS_EXTENT, 0.0, 0.0), "#d9465f", "x"),
            ((0.0, -self.AXIS_EXTENT, 0.0), (0.0, self.AXIS_EXTENT, 0.0), "#2f855a", "y"),
            ((0.0, 0.0, -self.AXIS_EXTENT), (0.0, 0.0, self.AXIS_EXTENT), "#2563eb", "z"),
        ]

        drawable_objects: list[tuple[float, dict[str, object]]] = []
        for scene_object in self.scene_objects:
            points = scene_object["points"]
            rotated_points = [self.rotate_point(point) for point in points]
            average_depth = sum(point[2] for point in rotated_points) / len(rotated_points)
            drawable_objects.append((average_depth, scene_object))

        for average_depth, scene_object in sorted(drawable_objects, key=lambda item: item[0]):
            object_type = scene_object["type"]
            points = scene_object["points"]
            color = str(scene_object["color"])
            projected_points = [self.project_point(point) for point in points]

            if object_type == "polygon":
                flattened_points = [coordinate for point in projected_points for coordinate in point]
                self.canvas.create_polygon(
                    *flattened_points,
                    fill=color,
                    outline="#36506b",
                    width=2,
                    stipple="gray25",
                )
            elif object_type in {"line", "path"}:
                self.canvas.create_line(
                    *[coordinate for point in projected_points for coordinate in point],
                    fill=color,
                    width=3,
                )
            elif object_type == "point":
                x_value, y_value = projected_points[0]
                self.canvas.create_oval(
                    x_value - 5,
                    y_value - 5,
                    x_value + 5,
                    y_value + 5,
                    fill=color,
                    outline=color,
                )

        for start_point, end_point, color, label in axes:
            start_pixel = self.project_point(start_point)
            end_pixel = self.project_point(end_point)
            self.canvas.create_line(
                start_pixel[0],
                start_pixel[1],
                end_pixel[0],
                end_pixel[1],
                fill=color,
                width=2,
            )
            self.canvas.create_text(
                end_pixel[0] + 10,
                end_pixel[1] - 8,
                text=label,
                fill=color,
                font=("Arial", 10, "bold"),
            )

        self.canvas.create_oval(
            projected_origin[0] - 4,
            projected_origin[1] - 4,
            projected_origin[0] + 4,
            projected_origin[1] + 4,
            fill="#111111",
            outline="#111111",
        )
        self.canvas.create_text(
            projected_origin[0] + 18,
            projected_origin[1] + 14,
            text="(0, 0, 0)",
            fill="#111111",
            font=("Arial", 10),
        )

    def draw_background_grid(self) -> None:
        """Draw a soft background grid on the 3D canvas."""
        for x_value in range(0, self.CANVAS_WIDTH, 40):
            self.canvas.create_line(
                x_value,
                0,
                x_value,
                self.CANVAS_HEIGHT,
                fill="#eef2f7",
            )

        for y_value in range(0, self.CANVAS_HEIGHT, 40):
            self.canvas.create_line(
                0,
                y_value,
                self.CANVAS_WIDTH,
                y_value,
                fill="#eef2f7",
            )

    def rotate_point(self, point: tuple[float, float, float]) -> tuple[float, float, float]:
        """Rotate a 3D point around the fixed origin."""
        x_value, y_value, z_value = point

        cos_y = math.cos(self.angle_y)
        sin_y = math.sin(self.angle_y)
        rotated_x = x_value * cos_y + z_value * sin_y
        rotated_z = -x_value * sin_y + z_value * cos_y

        cos_x = math.cos(self.angle_x)
        sin_x = math.sin(self.angle_x)
        rotated_y = y_value * cos_x - rotated_z * sin_x
        final_z = y_value * sin_x + rotated_z * cos_x

        return rotated_x, rotated_y, final_z

    def project_point(self, point: tuple[float, float, float]) -> tuple[float, float]:
        """Project a 3D point onto the 2D canvas."""
        rotated_x, rotated_y, rotated_z = self.rotate_point(point)
        perspective = self.CAMERA_DISTANCE / max(self.CAMERA_DISTANCE - rotated_z, 1.0)
        screen_x = self.CANVAS_WIDTH / 2 + rotated_x * self.BASE_SCALE * perspective
        screen_y = self.CANVAS_HEIGHT / 2 - rotated_y * self.BASE_SCALE * perspective
        return screen_x, screen_y

    def update_scene_info(self) -> None:
        """Update the scene summary text."""
        point_count = sum(1 for item in self.scene_objects if item["type"] == "point")
        line_count = sum(1 for item in self.scene_objects if item["type"] == "line")
        path_count = sum(1 for item in self.scene_objects if item["type"] == "path")
        polygon_count = sum(1 for item in self.scene_objects if item["type"] == "polygon")
        self.scene_info_var.set(
            "Rotate: drag inside the 3D view.\n"
            "Center: the view always rotates around the fixed origin (0, 0, 0).\n"
            f"Scene objects: {len(self.scene_objects)} total\n"
            f"Dots: {point_count}   Lines: {line_count}   Paths: {path_count}   Shaded faces: {polygon_count}"
        )

    def set_status(self, message: str, is_error: bool) -> None:
        """Show a status message below the controls."""
        self.status_var.set(message)
        self.status_label.config(fg="#b42318" if is_error else "#1d6f42")
