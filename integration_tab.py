"""Tkinter tabs for double and triple integration tools."""

from __future__ import annotations

import math
import tkinter as tk
from tkinter import ttk

import sympy as sp

from integration_utils import (
    calculate_double_integral,
    calculate_triple_integral,
    format_integration_steps,
)


class IntegrationTabBase(tk.Frame):
    """Shared layout and behavior for the calculus tabs."""

    VISUAL_WIDTH = 360
    VISUAL_HEIGHT = 230
    LEFT_MARGIN = 46
    RIGHT_MARGIN = 330
    TOP_MARGIN = 24
    BOTTOM_MARGIN = 202

    def __init__(
        self,
        parent: ttk.Notebook,
        title: str,
        intro_text: str,
        order_values: tuple[str, ...],
    ) -> None:
        super().__init__(parent, bg="#ffffff")
        self.title = title
        self.order_values = order_values
        self.answer_to_copy = ""
        self.status_var = tk.StringVar(value="")
        self.visual_text_var = tk.StringVar(value="")
        self.status_label: tk.Label | None = None
        self.help_label: tk.Label | None = None

        self.build_base_ui(intro_text)
        self.reset_visual()

    def build_base_ui(self, intro_text: str) -> None:
        """Create the shared tab layout."""
        outer_frame = tk.Frame(self, bg="#ffffff", padx=16, pady=16)
        outer_frame.pack(fill="both", expand=True)

        heading = tk.Label(
            outer_frame,
            text=self.title,
            font=("Arial", 15, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        heading.pack(anchor="w")

        intro_label = tk.Label(
            outer_frame,
            text=intro_text,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#4a5c6d",
            justify="left",
            wraplength=980,
        )
        intro_label.pack(anchor="w", pady=(6, 14))

        content_frame = tk.Frame(outer_frame, bg="#ffffff")
        content_frame.pack(fill="both", expand=True)

        left_panel = tk.Frame(content_frame, bg="#ffffff", width=420)
        left_panel.pack(side="left", fill="y", padx=(0, 18))
        left_panel.pack_propagate(False)

        right_panel = tk.Frame(content_frame, bg="#ffffff")
        right_panel.pack(side="left", fill="both", expand=True)

        form_frame = tk.Frame(left_panel, bg="#ffffff")
        form_frame.pack(fill="x")
        self.form_frame = form_frame
        self.build_form_fields()

        button_frame = tk.Frame(left_panel, bg="#ffffff")
        button_frame.pack(fill="x", pady=(14, 14))

        calculate_button = self.create_action_button(
            button_frame,
            text="Calculate",
            command=self.calculate_answer,
        )
        calculate_button.pack(side="left")

        clear_button = self.create_action_button(
            button_frame,
            text="Clear",
            command=self.clear_fields,
        )
        clear_button.pack(side="left", padx=(10, 0))

        self.copy_button = self.create_action_button(
            button_frame,
            text="Copy Answer",
            command=self.copy_answer,
            state=tk.DISABLED,
        )
        self.copy_button.pack(side="left", padx=(10, 0))

        self.status_label = tk.Label(
            left_panel,
            textvariable=self.status_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#1d6f42",
            anchor="w",
            justify="left",
            wraplength=390,
        )
        self.status_label.pack(fill="x", pady=(0, 10))

        visual_section = tk.Frame(left_panel, bg="#ffffff")
        visual_section.pack(fill="x", pady=(0, 12))

        visual_title = tk.Label(
            visual_section,
            text="Graph Explanation",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        visual_title.pack(anchor="w")

        self.visual_canvas = tk.Canvas(
            visual_section,
            width=self.VISUAL_WIDTH,
            height=self.VISUAL_HEIGHT,
            bg="#fbfdff",
            highlightthickness=1,
            highlightbackground="#c9d1d9",
        )
        self.visual_canvas.pack(anchor="w", pady=(8, 8))

        visual_text_label = tk.Label(
            visual_section,
            textvariable=self.visual_text_var,
            font=("Arial", 10),
            bg="#ffffff",
            fg="#3d5166",
            justify="left",
            anchor="nw",
            wraplength=390,
        )
        visual_text_label.pack(fill="x")

        output_label = tk.Label(
            right_panel,
            text="Step-by-Step Output",
            font=("Arial", 12, "bold"),
            bg="#ffffff",
            fg="#1f2d3d",
        )
        output_label.pack(anchor="w")

        output_frame = tk.Frame(right_panel, bg="#ffffff")
        output_frame.pack(fill="both", expand=True, pady=(8, 0))

        scrollbar = tk.Scrollbar(output_frame)
        scrollbar.pack(side="right", fill="y")

        self.output_text = tk.Text(
            output_frame,
            wrap="word",
            font=("Consolas", 11),
            bg="#f8fbff",
            fg="#243b53",
            relief="solid",
            bd=1,
            padx=14,
            pady=14,
            yscrollcommand=scrollbar.set,
        )
        self.output_text.pack(fill="both", expand=True)
        scrollbar.config(command=self.output_text.yview)

    def build_form_fields(self) -> None:
        """Implemented by each subclass."""
        raise NotImplementedError

    def calculate_answer(self) -> None:
        """Implemented by each subclass."""
        raise NotImplementedError

    def reset_visual(self) -> None:
        """Implemented by each subclass."""
        raise NotImplementedError

    def draw_visual_for_result(self, result: dict[str, object]) -> None:
        """Implemented by each subclass."""
        raise NotImplementedError

    def create_action_button(
        self,
        parent: tk.Widget,
        text: str,
        command,
        state: str = tk.NORMAL,
    ) -> tk.Button:
        """Create a blue action button."""
        return tk.Button(
            parent,
            text=text,
            command=command,
            state=state,
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

    def add_entry_field(
        self,
        row_index: int,
        label_text: str,
        default_value: str = "",
    ) -> tk.Entry:
        """Create one labeled text entry."""
        label = tk.Label(
            self.form_frame,
            text=label_text,
            font=("Arial", 11),
            bg="#ffffff",
            anchor="w",
        )
        label.grid(row=row_index, column=0, sticky="w", pady=4, padx=(0, 10))

        entry = tk.Entry(self.form_frame, font=("Arial", 11), width=28)
        entry.grid(row=row_index, column=1, sticky="w", pady=4)
        if default_value:
            entry.insert(0, default_value)
        return entry

    def add_order_field(self, row_index: int) -> ttk.Combobox:
        """Create the integration order selector."""
        label = tk.Label(
            self.form_frame,
            text="Integration order",
            font=("Arial", 11),
            bg="#ffffff",
            anchor="w",
        )
        label.grid(row=row_index, column=0, sticky="w", pady=4, padx=(0, 10))

        combo = ttk.Combobox(
            self.form_frame,
            values=self.order_values,
            state="readonly",
            width=25,
            font=("Arial", 11),
        )
        combo.grid(row=row_index, column=1, sticky="w", pady=4)
        combo.set(self.order_values[0])
        return combo

    def add_help_text(self, row_index: int, text: str) -> None:
        """Add a short help label below the form."""
        self.help_label = tk.Label(
            self.form_frame,
            text=text,
            font=("Arial", 9),
            bg="#ffffff",
            fg="#52667a",
            justify="left",
            wraplength=390,
        )
        self.help_label.grid(row=row_index, column=0, columnspan=2, sticky="w", pady=(8, 0))

    def set_output(self, text: str) -> None:
        """Replace the output text."""
        self.output_text.delete("1.0", tk.END)
        self.output_text.insert("1.0", text)

    def set_status(self, message: str, is_error: bool) -> None:
        """Show a status message in green or red."""
        self.status_var.set(message)
        if self.status_label is not None:
            self.status_label.config(fg="#b42318" if is_error else "#1d6f42")

    def clear_fields(self) -> None:
        """Clear all form fields and output."""
        for entry in self.entries:
            entry.delete(0, tk.END)
        self.order_combo.set(self.order_values[0])
        self.set_output("")
        self.answer_to_copy = ""
        self.copy_button.config(state=tk.DISABLED)
        self.reset_visual()
        self.set_status("Fields cleared.", is_error=False)

    def copy_answer(self) -> None:
        """Copy the final answer to the clipboard."""
        if not self.answer_to_copy:
            self.set_status("There is no answer to copy yet.", is_error=True)
            return

        self.clipboard_clear()
        self.clipboard_append(self.answer_to_copy)
        self.update()
        self.set_status("Answer copied to clipboard.", is_error=False)

    def clear_visual_canvas(self) -> None:
        """Clear the visual canvas."""
        self.visual_canvas.delete("all")

    def expr_to_float(self, expression: object, fallback: float = 0.0) -> float:
        """Convert a SymPy expression to float for drawing."""
        try:
            return float(sp.N(expression))
        except (TypeError, ValueError):
            return fallback

    def clamp_range(self, lower_value: float, upper_value: float) -> tuple[float, float]:
        """Make sure a visual range has non-zero width."""
        if abs(upper_value - lower_value) < 1e-9:
            return lower_value - 1.0, upper_value + 1.0
        return lower_value, upper_value

    def has_variable_limits(self, result: dict[str, object]) -> bool:
        """Return True when any bound depends on a variable."""
        return bool(result.get("has_variable_limits"))

    def is_one_function(self, expression: sp.Expr) -> bool:
        """Return True when the integrand is exactly 1."""
        return sp.simplify(expression - 1) == 0

    def evaluate_expression(
        self,
        expression: sp.Expr,
        substitutions: dict[str, float],
    ) -> float | None:
        """Evaluate a SymPy expression safely for drawing purposes."""
        try:
            evaluated = sp.N(
                expression.subs({sp.Symbol(name): value for name, value in substitutions.items()})
            )
            numeric_value = complex(evaluated)
        except (TypeError, ValueError, ZeroDivisionError):
            return None

        if abs(numeric_value.imag) > 1e-7:
            return None
        if math.isnan(numeric_value.real) or math.isinf(numeric_value.real):
            return None
        return float(numeric_value.real)

    def sample_values(self, start_value: float, end_value: float, count: int) -> list[float]:
        """Return evenly spaced numeric samples, including both endpoints."""
        if count <= 1 or abs(end_value - start_value) < 1e-9:
            return [start_value]

        step = (end_value - start_value) / (count - 1)
        return [start_value + step * index for index in range(count)]

    def expand_numeric_range(
        self,
        lower_value: float,
        upper_value: float,
        include_zero: bool = True,
        padding_ratio: float = 0.12,
    ) -> tuple[float, float]:
        """Expand a numeric range so the graph has a little breathing room."""
        if include_zero:
            lower_value = min(lower_value, 0.0)
            upper_value = max(upper_value, 0.0)

        lower_value, upper_value = self.clamp_range(lower_value, upper_value)
        span = upper_value - lower_value
        padding = max(span * padding_ratio, 0.35)
        return lower_value - padding, upper_value + padding

    def nice_tick_step(self, lower_value: float, upper_value: float, target_ticks: int = 6) -> float:
        """Choose a clean tick step such as 0.5, 1, 2, or 5."""
        span = max(upper_value - lower_value, 1e-9)
        raw_step = span / max(target_ticks, 1)
        magnitude = 10 ** math.floor(math.log10(raw_step))
        for multiplier in (1, 2, 5, 10):
            candidate = magnitude * multiplier
            if candidate >= raw_step:
                return candidate
        return magnitude * 10

    def format_number(self, value: float) -> str:
        """Format a number for axis and graph labels."""
        if abs(value) < 1e-9:
            value = 0.0
        if abs(value - round(value)) < 1e-8:
            return str(int(round(value)))
        return f"{value:.2f}".rstrip("0").rstrip(".")

    def blend_color(self, start_color: str, end_color: str, ratio: float) -> str:
        """Blend two hex colors by a ratio from 0 to 1."""
        ratio = max(0.0, min(1.0, ratio))
        start_values = [int(start_color[index : index + 2], 16) for index in (1, 3, 5)]
        end_values = [int(end_color[index : index + 2], 16) for index in (1, 3, 5)]
        blended = [
            round(start_value + (end_value - start_value) * ratio)
            for start_value, end_value in zip(start_values, end_values)
        ]
        return "#" + "".join(f"{value:02x}" for value in blended)

    def function_fill_color(self, value: float, scale_base: float) -> str:
        """Choose a region color from the sampled function value."""
        if scale_base <= 1e-9:
            return "#e6eef8"

        intensity = min(abs(value) / scale_base, 1.0)
        if abs(value) < 1e-9:
            return "#eef2f7"
        if value > 0:
            return self.blend_color("#e8f1ff", "#1e63d6", intensity)
        return self.blend_color("#fff0db", "#d97706", intensity)

    def draw_cartesian_grid(
        self,
        x_range: tuple[float, float],
        y_range: tuple[float, float],
    ) -> tuple[callable, callable]:
        """Draw an adaptive 2D graph background and return mapping functions."""
        left = self.LEFT_MARGIN
        right = self.RIGHT_MARGIN
        top = self.TOP_MARGIN
        bottom = self.BOTTOM_MARGIN
        x_min, x_max = x_range
        y_min, y_max = y_range

        def map_x(value: float) -> float:
            return left + (value - x_min) * (right - left) / (x_max - x_min)

        def map_y(value: float) -> float:
            return bottom - (value - y_min) * (bottom - top) / (y_max - y_min)

        self.visual_canvas.create_rectangle(left, top, right, bottom, outline="#d9e2ec", width=1)

        x_tick = self.nice_tick_step(x_min, x_max)
        y_tick = self.nice_tick_step(y_min, y_max)

        tick_value = math.ceil(x_min / x_tick) * x_tick
        while tick_value <= x_max + 1e-9:
            x_pixel = map_x(tick_value)
            self.visual_canvas.create_line(x_pixel, top, x_pixel, bottom, fill="#e7edf3")
            if abs(tick_value) > 1e-9:
                self.visual_canvas.create_text(
                    x_pixel,
                    bottom + 12,
                    text=self.format_number(tick_value),
                    font=("Arial", 8),
                    fill="#61788f",
                )
            tick_value += x_tick

        tick_value = math.ceil(y_min / y_tick) * y_tick
        while tick_value <= y_max + 1e-9:
            y_pixel = map_y(tick_value)
            self.visual_canvas.create_line(left, y_pixel, right, y_pixel, fill="#e7edf3")
            if abs(tick_value) > 1e-9:
                self.visual_canvas.create_text(
                    left - 10,
                    y_pixel,
                    text=self.format_number(tick_value),
                    font=("Arial", 8),
                    fill="#61788f",
                    anchor="e",
                )
            tick_value += y_tick

        axis_y = map_y(0.0) if y_min <= 0.0 <= y_max else bottom
        axis_x = map_x(0.0) if x_min <= 0.0 <= x_max else left

        self.visual_canvas.create_line(left, axis_y, right, axis_y, fill="#1f2d3d", width=2)
        self.visual_canvas.create_line(axis_x, bottom, axis_x, top, fill="#1f2d3d", width=2)
        self.visual_canvas.create_text(right + 10, axis_y + 10, text="x", font=("Arial", 10, "bold"))
        self.visual_canvas.create_text(axis_x - 10, top - 10, text="y", font=("Arial", 10, "bold"))

        if x_min <= 0.0 <= x_max and y_min <= 0.0 <= y_max:
            self.visual_canvas.create_text(
                axis_x + 10,
                axis_y + 12,
                text="0",
                font=("Arial", 8),
                fill="#61788f",
            )

        return map_x, map_y


class DoubleIntegrationTab(IntegrationTabBase):
    """Double integration tab."""

    def __init__(self, parent: ttk.Notebook) -> None:
        super().__init__(
            parent,
            title="Double Integration",
            intro_text=(
                "Enter f(x, y), choose x and y limits, and SmartGraph will show a "
                "step-by-step double integration result for area or volume."
            ),
            order_values=("dx dy", "dy dx"),
        )

    def build_form_fields(self) -> None:
        """Create the input fields for double integration."""
        self.function_entry = self.add_entry_field(0, "Function f(x, y)", "x + y")
        self.x_lower_entry = self.add_entry_field(1, "x lower limit", "0")
        self.x_upper_entry = self.add_entry_field(2, "x upper limit", "1")
        self.y_lower_entry = self.add_entry_field(3, "y lower limit", "0")
        self.y_upper_entry = self.add_entry_field(4, "y upper limit", "2")
        self.order_combo = self.add_order_field(5)
        self.add_help_text(
            6,
            "Variable limits are supported. Example: for order dx dy, x bounds may use y, such as x = 0 to y.",
        )

        self.entries = [
            self.function_entry,
            self.x_lower_entry,
            self.x_upper_entry,
            self.y_lower_entry,
            self.y_upper_entry,
        ]

    def calculate_answer(self) -> None:
        """Run the double integration and display the result."""
        try:
            result = calculate_double_integral(
                self.function_entry.get(),
                self.x_lower_entry.get(),
                self.x_upper_entry.get(),
                self.y_lower_entry.get(),
                self.y_upper_entry.get(),
                self.order_combo.get(),
            )
        except ValueError as error:
            self.set_output(str(error))
            self.answer_to_copy = ""
            self.copy_button.config(state=tk.DISABLED)
            self.reset_visual()
            self.set_status(str(error), is_error=True)
            return

        self.set_output(format_integration_steps(result))
        self.answer_to_copy = str(result["final_answer"])
        self.copy_button.config(state=tk.NORMAL)
        self.draw_visual_for_result(result)
        self.set_status("Double integration completed.", is_error=False)

    def reset_visual(self) -> None:
        """Show the default graph explanation for double integration."""
        self.clear_visual_canvas()
        map_x, map_y = self.draw_cartesian_grid((-1.0, 4.0), (-1.0, 3.0))

        preview_points = [(0.3, 0.2), (2.8, 0.2), (2.8, 1.8), (0.3, 1.8)]
        pixel_points = [coordinate for point in preview_points for coordinate in (map_x(point[0]), map_y(point[1]))]
        self.visual_canvas.create_polygon(
            *pixel_points,
            fill="#d7e8ff",
            outline="#2d6cdf",
            width=2,
        )
        self.visual_canvas.create_line(map_x(0.3), map_y(1.0), map_x(2.8), map_y(1.0), fill="#7aa6f8", dash=(5, 3))
        self.visual_canvas.create_text(
            map_x(1.6),
            map_y(2.05),
            text="Integration region",
            font=("Arial", 10, "bold"),
            fill="#2d6cdf",
        )

        self.visual_text_var.set(
            "The graph view now scales itself to the limits you enter.\n\n"
            "SmartGraph shades the actual x-y region and shows sample inner slices in the chosen order.\n\n"
            "For non-constant functions, the region is color-sampled from the function values and short columns hint "
            "at how the surface height changes over that region."
        )

    def draw_visual_for_result(self, result: dict[str, object]) -> None:
        """Draw the sampled x-y region from the entered limits."""
        self.clear_visual_canvas()
        region_data = self.build_region_data(result)
        if region_data is None:
            self.reset_visual()
            self.visual_text_var.set(
                "SmartGraph could not sample this region cleanly for drawing, but the symbolic answer is still valid."
            )
            return

        map_x, map_y = self.draw_cartesian_grid(region_data["x_range"], region_data["y_range"])

        if self.is_one_function(result["function"]):
            polygon_pixels = [
                coordinate
                for x_value, y_value in region_data["polygon"]
                for coordinate in (map_x(x_value), map_y(y_value))
            ]
            self.visual_canvas.create_polygon(
                *polygon_pixels,
                fill="#d7e8ff",
                outline="#2d6cdf",
                width=2,
            )
        else:
            self.draw_function_bands(region_data, map_x, map_y)

        for boundary in (region_data["lower_boundary"], region_data["upper_boundary"]):
            boundary_pixels = [
                coordinate
                for x_value, y_value in boundary
                for coordinate in (map_x(x_value), map_y(y_value))
            ]
            self.visual_canvas.create_line(*boundary_pixels, fill="#1e63d6", width=2, smooth=True)

        for start_point, end_point in region_data["slice_segments"]:
            self.visual_canvas.create_line(
                map_x(start_point[0]),
                map_y(start_point[1]),
                map_x(end_point[0]),
                map_y(end_point[1]),
                fill="#7aa6f8",
                dash=(5, 3),
            )

        if result["order"] == "dx dy":
            self.visual_canvas.create_text(
                self.RIGHT_MARGIN - 18,
                self.TOP_MARGIN + 12,
                text="Inner slices: dx",
                font=("Arial", 9, "bold"),
                fill="#4c6fff",
                anchor="e",
            )
        else:
            self.visual_canvas.create_text(
                self.RIGHT_MARGIN - 18,
                self.TOP_MARGIN + 12,
                text="Inner slices: dy",
                font=("Arial", 9, "bold"),
                fill="#4c6fff",
                anchor="e",
            )

        if self.has_variable_limits(result):
            self.draw_bound_expression_labels(result, region_data, map_x, map_y)

        if not self.is_one_function(result["function"]):
            self.draw_function_columns(region_data, map_x, map_y)

        title_text = (
            "Area region"
            if self.is_one_function(result["function"])
            else "Function-colored region"
        )
        self.visual_canvas.create_text(
            self.LEFT_MARGIN + 6,
            self.TOP_MARGIN - 10,
            text=title_text,
            font=("Arial", 10, "bold"),
            fill="#2d6cdf",
            anchor="w",
        )

        self.visual_text_var.set(self.build_visual_explanation(result, region_data))

    def build_region_data(self, result: dict[str, object]) -> dict[str, object] | None:
        """Sample the entered limits and build a drawable 2D region."""
        x_lower_expr, x_upper_expr = result["limits"]["x"]
        y_lower_expr, y_upper_expr = result["limits"]["y"]
        order = str(result["order"])

        lower_boundary: list[tuple[float, float]] = []
        upper_boundary: list[tuple[float, float]] = []
        slice_segments: list[tuple[tuple[float, float], tuple[float, float]]] = []

        if order == "dx dy":
            outer_start = self.expr_to_float(y_lower_expr, 0.0)
            outer_end = self.expr_to_float(y_upper_expr, 1.0)
            outer_values = self.sample_values(outer_start, outer_end, 90)

            for outer_value in outer_values:
                lower_x = self.evaluate_expression(x_lower_expr, {"y": outer_value})
                upper_x = self.evaluate_expression(x_upper_expr, {"y": outer_value})
                if lower_x is None or upper_x is None:
                    continue
                lower_boundary.append((lower_x, outer_value))
                upper_boundary.append((upper_x, outer_value))

            for outer_value in self.sample_values(outer_start, outer_end, 5):
                lower_x = self.evaluate_expression(x_lower_expr, {"y": outer_value})
                upper_x = self.evaluate_expression(x_upper_expr, {"y": outer_value})
                if lower_x is None or upper_x is None:
                    continue
                slice_segments.append(((lower_x, outer_value), (upper_x, outer_value)))

        else:
            outer_start = self.expr_to_float(x_lower_expr, 0.0)
            outer_end = self.expr_to_float(x_upper_expr, 1.0)
            outer_values = self.sample_values(outer_start, outer_end, 90)

            for outer_value in outer_values:
                lower_y = self.evaluate_expression(y_lower_expr, {"x": outer_value})
                upper_y = self.evaluate_expression(y_upper_expr, {"x": outer_value})
                if lower_y is None or upper_y is None:
                    continue
                lower_boundary.append((outer_value, lower_y))
                upper_boundary.append((outer_value, upper_y))

            for outer_value in self.sample_values(outer_start, outer_end, 5):
                lower_y = self.evaluate_expression(y_lower_expr, {"x": outer_value})
                upper_y = self.evaluate_expression(y_upper_expr, {"x": outer_value})
                if lower_y is None or upper_y is None:
                    continue
                slice_segments.append(((outer_value, lower_y), (outer_value, upper_y)))

        if len(lower_boundary) < 2 or len(upper_boundary) < 2:
            return None

        polygon = lower_boundary + list(reversed(upper_boundary))
        x_values = [point[0] for point in polygon]
        y_values = [point[1] for point in polygon]
        x_range = self.expand_numeric_range(min(x_values), max(x_values))
        y_range = self.expand_numeric_range(min(y_values), max(y_values))

        function_columns, function_range = self.sample_function_columns(result, slice_segments)
        function_bands = self.build_function_bands(result, lower_boundary, upper_boundary)
        band_values = [float(band["value"]) for band in function_bands]
        column_values = [float(column["value"]) for column in function_columns]
        all_values = band_values + column_values
        if all_values:
            function_range = (min(all_values), max(all_values))

        return {
            "polygon": polygon,
            "lower_boundary": lower_boundary,
            "upper_boundary": upper_boundary,
            "slice_segments": slice_segments,
            "function_columns": function_columns,
            "function_bands": function_bands,
            "function_range": function_range,
            "x_range": x_range,
            "y_range": y_range,
        }

    def build_function_bands(
        self,
        result: dict[str, object],
        lower_boundary: list[tuple[float, float]],
        upper_boundary: list[tuple[float, float]],
    ) -> list[dict[str, object]]:
        """Build thin filled strips whose color comes from the sampled function value."""
        expression = result["function"]
        band_count = min(len(lower_boundary), len(upper_boundary)) - 1
        if band_count <= 0:
            return []

        bands: list[dict[str, object]] = []
        for index in range(band_count):
            polygon = [
                lower_boundary[index],
                upper_boundary[index],
                upper_boundary[index + 1],
                lower_boundary[index + 1],
            ]
            center_x = sum(point[0] for point in polygon) / len(polygon)
            center_y = sum(point[1] for point in polygon) / len(polygon)
            function_value = self.evaluate_expression(expression, {"x": center_x, "y": center_y})
            if function_value is None:
                continue
            bands.append({"polygon": polygon, "value": function_value})

        return bands

    def sample_function_columns(
        self,
        result: dict[str, object],
        slice_segments: list[tuple[tuple[float, float], tuple[float, float]]],
    ) -> tuple[list[dict[str, float]], tuple[float, float] | None]:
        """Sample a few interior points to hint at the surface height."""
        expression = result["function"]
        sampled_columns: list[dict[str, float]] = []
        sampled_values: list[float] = []

        for start_point, end_point in slice_segments:
            x_value = (start_point[0] + end_point[0]) / 2
            y_value = (start_point[1] + end_point[1]) / 2
            function_value = self.evaluate_expression(expression, {"x": x_value, "y": y_value})
            if function_value is None:
                continue

            sampled_columns.append({"x": x_value, "y": y_value, "value": function_value})
            sampled_values.append(function_value)

        if not sampled_values:
            return sampled_columns, None
        return sampled_columns, (min(sampled_values), max(sampled_values))

    def draw_function_bands(
        self,
        region_data: dict[str, object],
        map_x,
        map_y,
    ) -> None:
        """Fill the region with colors sampled from the function values."""
        bands = list(region_data["function_bands"])
        function_range = region_data["function_range"]
        if not bands or function_range is None:
            polygon_pixels = [
                coordinate
                for x_value, y_value in region_data["polygon"]
                for coordinate in (map_x(x_value), map_y(y_value))
            ]
            self.visual_canvas.create_polygon(
                *polygon_pixels,
                fill="#d7e8ff",
                outline="",
            )
            return

        scale_base = max(abs(function_range[0]), abs(function_range[1]), 1.0)
        for band in bands:
            polygon_pixels = [
                coordinate
                for x_value, y_value in band["polygon"]
                for coordinate in (map_x(x_value), map_y(y_value))
            ]
            self.visual_canvas.create_polygon(
                *polygon_pixels,
                fill=self.function_fill_color(float(band["value"]), scale_base),
                outline="",
            )

    def draw_function_columns(
        self,
        region_data: dict[str, object],
        map_x,
        map_y,
    ) -> None:
        """Draw a few short columns to show how f(x, y) changes on the region."""
        columns = list(region_data["function_columns"])
        function_range = region_data["function_range"]
        if not columns or function_range is None:
            return

        min_value, max_value = function_range
        scale_base = max(abs(min_value), abs(max_value), 1.0)
        top_points: list[tuple[float, float]] = []

        for column in columns:
            start_x = map_x(column["x"])
            start_y = map_y(column["y"])
            relative_height = 14 + 24 * abs(column["value"]) / scale_base

            if column["value"] >= 0:
                end_x = start_x + 14
                end_y = start_y - relative_height
                color = "#1e63d6"
            else:
                end_x = start_x + 14
                end_y = start_y + relative_height * 0.55
                color = "#d97706"

            self.visual_canvas.create_line(start_x, start_y, end_x, end_y, fill=color, width=2)
            self.visual_canvas.create_oval(end_x - 3, end_y - 3, end_x + 3, end_y + 3, fill=color, outline=color)
            top_points.append((end_x, end_y))

        if len(top_points) >= 2:
            self.visual_canvas.create_line(
                *[coordinate for point in top_points for coordinate in point],
                fill="#36506b",
                width=2,
                smooth=True,
            )

    def draw_bound_expression_labels(
        self,
        result: dict[str, object],
        region_data: dict[str, object],
        map_x,
        map_y,
    ) -> None:
        """Label curved bounds so the sketch matches the entered expressions."""
        middle_index = len(region_data["lower_boundary"]) // 2
        lower_point = region_data["lower_boundary"][middle_index]
        upper_point = region_data["upper_boundary"][middle_index]

        if result["order"] == "dx dy":
            lower_label = f"x = {sp.sstr(result['limits']['x'][0])}"
            upper_label = f"x = {sp.sstr(result['limits']['x'][1])}"
        else:
            lower_label = f"y = {sp.sstr(result['limits']['y'][0])}"
            upper_label = f"y = {sp.sstr(result['limits']['y'][1])}"

        self.visual_canvas.create_text(
            map_x(lower_point[0]) - 8,
            map_y(lower_point[1]) - 12,
            text=lower_label,
            font=("Arial", 8, "bold"),
            fill="#36506b",
            anchor="e",
        )
        self.visual_canvas.create_text(
            map_x(upper_point[0]) + 8,
            map_y(upper_point[1]) - 12,
            text=upper_label,
            font=("Arial", 8, "bold"),
            fill="#36506b",
            anchor="w",
        )

    def build_visual_explanation(self, result: dict[str, object], region_data: dict[str, object]) -> str:
        """Build a student-friendly explanation based on the sampled graph."""
        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]
        function_range = region_data["function_range"]

        if self.is_one_function(result["function"]):
            if result["order"] == "dx dy":
                return (
                    "SmartGraph sampled the region directly from your limits.\n\n"
                    f"Here, y runs from {sp.sstr(y_lower)} to {sp.sstr(y_upper)}, and each horizontal slice runs from "
                    f"x = {sp.sstr(x_lower)} to x = {sp.sstr(x_upper)}.\n\n"
                    "Because f(x, y) = 1, the double integral measures the shaded area itself."
                )

            return (
                "SmartGraph sampled the region directly from your limits.\n\n"
                f"Here, x runs from {sp.sstr(x_lower)} to {sp.sstr(x_upper)}, and each vertical slice runs from "
                f"y = {sp.sstr(y_lower)} to y = {sp.sstr(y_upper)}.\n\n"
                "Because f(x, y) = 1, the double integral measures the shaded area itself."
            )

        range_text = ""
        if function_range is not None:
            min_value, max_value = function_range
            range_text = (
                f" Sampled values of f(x, y) on the region run from about "
                f"{self.format_number(min_value)} to {self.format_number(max_value)}."
            )

        if result["order"] == "dx dy":
            return (
                "The shaded blue shape is the actual x-y region from your entered bounds.\n\n"
                "The dashed horizontal slices show the inner dx integration. The fill color is sampled from the "
                "function values, so deeper blue means larger positive values and orange means negative values. "
                "The short columns then hint at the surface height.\n\n"
                f"That means the double integral is adding many thin columns over y = {sp.sstr(y_lower)} to "
                f"y = {sp.sstr(y_upper)}.{range_text}"
            )

        return (
            "The shaded blue shape is the actual x-y region from your entered bounds.\n\n"
            "The dashed vertical slices show the inner dy integration. The fill color is sampled from the "
            "function values, so deeper blue means larger positive values and orange means negative values. "
            "The short columns then hint at the surface height.\n\n"
            f"That means the double integral is adding many thin columns over x = {sp.sstr(x_lower)} to "
            f"x = {sp.sstr(x_upper)}.{range_text}"
        )


class TripleIntegrationTab(IntegrationTabBase):
    """Triple integration tab."""

    def __init__(self, parent: ttk.Notebook) -> None:
        super().__init__(
            parent,
            title="Triple Integration",
            intro_text=(
                "Enter f(x, y, z), choose x, y, and z limits, and SmartGraph will show "
                "a step-by-step triple integration result for volume or total value."
            ),
            order_values=(
                "dx dy dz",
                "dx dz dy",
                "dy dx dz",
                "dy dz dx",
                "dz dx dy",
                "dz dy dx",
            ),
        )

    def build_form_fields(self) -> None:
        """Create the input fields for triple integration."""
        self.function_entry = self.add_entry_field(0, "Function f(x, y, z)", "x + y + z")
        self.x_lower_entry = self.add_entry_field(1, "x lower limit", "0")
        self.x_upper_entry = self.add_entry_field(2, "x upper limit", "1")
        self.y_lower_entry = self.add_entry_field(3, "y lower limit", "0")
        self.y_upper_entry = self.add_entry_field(4, "y upper limit", "1")
        self.z_lower_entry = self.add_entry_field(5, "z lower limit", "0")
        self.z_upper_entry = self.add_entry_field(6, "z upper limit", "1")
        self.order_combo = self.add_order_field(7)
        self.add_help_text(
            8,
            "Variable limits are supported. Example: for order dx dy dz, x bounds may use y and z, and y bounds may use z.",
        )

        self.entries = [
            self.function_entry,
            self.x_lower_entry,
            self.x_upper_entry,
            self.y_lower_entry,
            self.y_upper_entry,
            self.z_lower_entry,
            self.z_upper_entry,
        ]

    def calculate_answer(self) -> None:
        """Run the triple integration and display the result."""
        try:
            result = calculate_triple_integral(
                self.function_entry.get(),
                self.x_lower_entry.get(),
                self.x_upper_entry.get(),
                self.y_lower_entry.get(),
                self.y_upper_entry.get(),
                self.z_lower_entry.get(),
                self.z_upper_entry.get(),
                self.order_combo.get(),
            )
        except ValueError as error:
            self.set_output(str(error))
            self.answer_to_copy = ""
            self.copy_button.config(state=tk.DISABLED)
            self.reset_visual()
            self.set_status(str(error), is_error=True)
            return

        self.set_output(format_integration_steps(result))
        self.answer_to_copy = str(result["final_answer"])
        self.copy_button.config(state=tk.NORMAL)
        self.draw_visual_for_result(result)
        self.set_status("Triple integration completed.", is_error=False)

    def reset_visual(self) -> None:
        """Show the default graph explanation for triple integration."""
        self.clear_visual_canvas()
        self.visual_text_var.set(
            "The graph view adapts to the entered x, y, and z bounds.\n\n"
            "For constant bounds, SmartGraph draws the matching 3D box. For variable bounds, it stacks sampled "
            "cross-sections so students can see the region changing shape.\n\n"
            "If f(x, y, z) = 1, the answer is volume. Otherwise the integrand acts like a density over the region."
        )

        preview_box = [
            (0.0, 0.0, 0.0),
            (2.0, 0.0, 0.0),
            (2.0, 1.6, 0.0),
            (0.0, 1.6, 0.0),
            (0.0, 0.0, 1.5),
            (2.0, 0.0, 1.5),
            (2.0, 1.6, 1.5),
            (0.0, 1.6, 1.5),
        ]
        mapper = self.build_projection_mapper(preview_box)
        self.draw_projected_box(preview_box, mapper)
        self.visual_canvas.create_text(
            self.LEFT_MARGIN + 6,
            self.TOP_MARGIN - 10,
            text="3D integration region",
            font=("Arial", 10, "bold"),
            fill="#2d6cdf",
            anchor="w",
        )

    def draw_visual_for_result(self, result: dict[str, object]) -> None:
        """Draw an adaptive 3D region from the entered limits."""
        self.clear_visual_canvas()

        if self.has_variable_limits(result):
            region_data = self.build_variable_volume_data(result)
            if region_data is None:
                self.reset_visual()
                self.visual_text_var.set(
                    "SmartGraph solved the integral, but the region was too hard to sample cleanly for the preview."
                )
                return

            mapper = self.build_projection_mapper(region_data["points"])
            self.draw_reference_triad(mapper)

            for index, polygon in enumerate(region_data["slice_polygons"]):
                self.draw_projected_polygon(
                    polygon,
                    mapper,
                    fill="#d7e8ff" if index % 2 == 0 else "#c7dbff",
                    outline="#2d6cdf",
                )

            for start_point, end_point in region_data["spine_lines"]:
                self.draw_projected_segment(start_point, end_point, mapper, dash=(4, 2))

            self.visual_canvas.create_text(
                self.LEFT_MARGIN + 6,
                self.TOP_MARGIN - 10,
                text="Sampled variable-bound slices",
                font=("Arial", 10, "bold"),
                fill="#2d6cdf",
                anchor="w",
            )
            self.visual_text_var.set(self.build_variable_limit_explanation(result))
            return

        box_points = self.build_constant_box_points(result)
        mapper = self.build_projection_mapper(box_points)
        self.draw_reference_triad(mapper)
        self.draw_projected_box(box_points, mapper)

        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]
        z_lower, z_upper = result["limits"]["z"]
        self.visual_canvas.create_text(
            self.RIGHT_MARGIN + 12,
            self.BOTTOM_MARGIN - 16,
            text=f"x: {sp.sstr(x_lower)} to {sp.sstr(x_upper)}",
            anchor="w",
            font=("Arial", 8),
            fill="#36506b",
        )
        self.visual_canvas.create_text(
            self.RIGHT_MARGIN + 12,
            self.BOTTOM_MARGIN - 2,
            text=f"y: {sp.sstr(y_lower)} to {sp.sstr(y_upper)}",
            anchor="w",
            font=("Arial", 8),
            fill="#36506b",
        )
        self.visual_canvas.create_text(
            self.RIGHT_MARGIN + 12,
            self.BOTTOM_MARGIN + 12,
            text=f"z: {sp.sstr(z_lower)} to {sp.sstr(z_upper)}",
            anchor="w",
            font=("Arial", 8),
            fill="#36506b",
        )

        title_text = "Volume region" if self.is_one_function(result["function"]) else "Region with density f(x, y, z)"
        self.visual_canvas.create_text(
            self.LEFT_MARGIN + 6,
            self.TOP_MARGIN - 10,
            text=title_text,
            font=("Arial", 10, "bold"),
            fill="#2d6cdf",
            anchor="w",
        )
        self.visual_text_var.set(self.build_visual_explanation(result))

    def build_constant_box_points(self, result: dict[str, object]) -> list[tuple[float, float, float]]:
        """Return the eight corners of a constant-bound box."""
        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]
        z_lower, z_upper = result["limits"]["z"]
        x0 = self.expr_to_float(x_lower, 0.0)
        x1 = self.expr_to_float(x_upper, 1.0)
        y0 = self.expr_to_float(y_lower, 0.0)
        y1 = self.expr_to_float(y_upper, 1.0)
        z0 = self.expr_to_float(z_lower, 0.0)
        z1 = self.expr_to_float(z_upper, 1.0)
        return [
            (x0, y0, z0),
            (x1, y0, z0),
            (x1, y1, z0),
            (x0, y1, z0),
            (x0, y0, z1),
            (x1, y0, z1),
            (x1, y1, z1),
            (x0, y1, z1),
        ]

    def build_projection_mapper(self, points: list[tuple[float, float, float]]):
        """Create a simple oblique projection that fits the preview canvas."""
        if not points:
            points = [(0.0, 0.0, 0.0)]

        all_points = list(points)
        all_points.extend(
            [
                (0.0, 0.0, 0.0),
                (1.0, 0.0, 0.0),
                (0.0, 1.0, 0.0),
                (0.0, 0.0, 1.0),
            ]
        )
        projected = [self.project_point_3d(point) for point in all_points]
        projected_x = [point[0] for point in projected]
        projected_y = [point[1] for point in projected]

        min_x, max_x = self.expand_numeric_range(min(projected_x), max(projected_x), include_zero=False, padding_ratio=0.08)
        min_y, max_y = self.expand_numeric_range(min(projected_y), max(projected_y), include_zero=False, padding_ratio=0.08)

        left = self.LEFT_MARGIN
        right = self.RIGHT_MARGIN - 26
        top = self.TOP_MARGIN + 6
        bottom = self.BOTTOM_MARGIN

        def mapper(point: tuple[float, float, float]) -> tuple[float, float]:
            projected_x_value, projected_y_value = self.project_point_3d(point)
            x_pixel = left + (projected_x_value - min_x) * (right - left) / (max_x - min_x)
            y_pixel = bottom - (projected_y_value - min_y) * (bottom - top) / (max_y - min_y)
            return x_pixel, y_pixel

        return mapper

    def project_point_3d(self, point: tuple[float, float, float]) -> tuple[float, float]:
        """Project a 3D point to a 2D sketch using a fixed classroom-style view."""
        x_value, y_value, z_value = point
        return x_value + 0.75 * y_value, z_value + 0.38 * y_value

    def draw_projected_polygon(
        self,
        points: list[tuple[float, float, float]],
        mapper,
        fill: str,
        outline: str,
    ) -> None:
        """Draw one projected polygon."""
        flattened = [coordinate for point in points for coordinate in mapper(point)]
        self.visual_canvas.create_polygon(
            *flattened,
            fill=fill,
            outline=outline,
            width=2,
            stipple="gray25",
        )

    def draw_projected_segment(
        self,
        start_point: tuple[float, float, float],
        end_point: tuple[float, float, float],
        mapper,
        dash: tuple[int, int] | None = None,
        fill: str = "#2d6cdf",
    ) -> None:
        """Draw one projected line segment."""
        start_pixel = mapper(start_point)
        end_pixel = mapper(end_point)
        self.visual_canvas.create_line(
            start_pixel[0],
            start_pixel[1],
            end_pixel[0],
            end_pixel[1],
            fill=fill,
            width=2,
            dash=dash,
        )

    def draw_projected_box(self, points: list[tuple[float, float, float]], mapper) -> None:
        """Draw the visible faces and edges of a rectangular box."""
        bottom_face = [points[0], points[1], points[2], points[3]]
        top_face = [points[4], points[5], points[6], points[7]]
        front_face = [points[0], points[1], points[5], points[4]]
        side_face = [points[1], points[2], points[6], points[5]]

        self.draw_projected_polygon(bottom_face, mapper, fill="#eef5ff", outline="#2d6cdf")
        self.draw_projected_polygon(front_face, mapper, fill="#d7e8ff", outline="#2d6cdf")
        self.draw_projected_polygon(side_face, mapper, fill="#c7dbff", outline="#2d6cdf")
        self.draw_projected_polygon(top_face, mapper, fill="#f6faff", outline="#2d6cdf")

        edge_pairs = (
            (points[0], points[3]),
            (points[3], points[7]),
            (points[7], points[4]),
            (points[4], points[0]),
            (points[2], points[3]),
            (points[2], points[6]),
            (points[6], points[7]),
        )
        for start_point, end_point in edge_pairs:
            self.draw_projected_segment(start_point, end_point, mapper)

    def draw_reference_triad(self, mapper) -> None:
        """Draw a small axis triad anchored at the true origin."""
        origin = (0.0, 0.0, 0.0)
        axes = [
            ((1.0, 0.0, 0.0), "#d9465f", "x"),
            ((0.0, 1.0, 0.0), "#2f855a", "y"),
            ((0.0, 0.0, 1.0), "#2563eb", "z"),
        ]
        origin_pixel = mapper(origin)
        self.visual_canvas.create_oval(
            origin_pixel[0] - 3,
            origin_pixel[1] - 3,
            origin_pixel[0] + 3,
            origin_pixel[1] + 3,
            fill="#111111",
            outline="#111111",
        )
        self.visual_canvas.create_text(
            origin_pixel[0] + 14,
            origin_pixel[1] + 12,
            text="(0,0,0)",
            font=("Arial", 8),
            fill="#111111",
        )

        for end_point, color, label in axes:
            end_pixel = mapper(end_point)
            self.visual_canvas.create_line(
                origin_pixel[0],
                origin_pixel[1],
                end_pixel[0],
                end_pixel[1],
                fill=color,
                width=2,
            )
            self.visual_canvas.create_text(
                end_pixel[0] + 8,
                end_pixel[1] - 6,
                text=label,
                font=("Arial", 9, "bold"),
                fill=color,
            )

    def build_variable_volume_data(self, result: dict[str, object]) -> dict[str, object] | None:
        """Sample cross-sections for a variable-bound triple integral region."""
        inner_name, middle_name, outer_name = result["variable_order"]
        inner_lower_expr, inner_upper_expr = result["limits"][inner_name]
        middle_lower_expr, middle_upper_expr = result["limits"][middle_name]
        outer_lower_expr, outer_upper_expr = result["limits"][outer_name]

        outer_start = self.expr_to_float(outer_lower_expr, 0.0)
        outer_end = self.expr_to_float(outer_upper_expr, 1.0)
        slice_polygons: list[list[tuple[float, float, float]]] = []
        spine_lines: list[tuple[tuple[float, float, float], tuple[float, float, float]]] = []
        all_points: list[tuple[float, float, float]] = []

        for outer_value in self.sample_values(outer_start, outer_end, 4):
            middle_lower = self.evaluate_expression(middle_lower_expr, {outer_name: outer_value})
            middle_upper = self.evaluate_expression(middle_upper_expr, {outer_name: outer_value})
            if middle_lower is None or middle_upper is None:
                continue

            middle_values = self.sample_values(middle_lower, middle_upper, 60)
            lower_boundary: list[tuple[float, float, float]] = []
            upper_boundary: list[tuple[float, float, float]] = []

            for middle_value in middle_values:
                substitutions = {outer_name: outer_value, middle_name: middle_value}
                inner_lower = self.evaluate_expression(inner_lower_expr, substitutions)
                inner_upper = self.evaluate_expression(inner_upper_expr, substitutions)
                if inner_lower is None or inner_upper is None:
                    continue
                lower_boundary.append(
                    self.make_3d_point(
                        inner_name,
                        middle_name,
                        outer_name,
                        inner_lower,
                        middle_value,
                        outer_value,
                    )
                )
                upper_boundary.append(
                    self.make_3d_point(
                        inner_name,
                        middle_name,
                        outer_name,
                        inner_upper,
                        middle_value,
                        outer_value,
                    )
                )

            if len(lower_boundary) < 2 or len(upper_boundary) < 2:
                continue

            polygon = lower_boundary + list(reversed(upper_boundary))
            slice_polygons.append(polygon)
            all_points.extend(polygon)

            spine_lines.append((lower_boundary[len(lower_boundary) // 2], upper_boundary[len(upper_boundary) // 2]))

        if not slice_polygons:
            return None

        return {
            "points": all_points,
            "slice_polygons": slice_polygons,
            "spine_lines": spine_lines,
        }

    def make_3d_point(
        self,
        inner_name: str,
        middle_name: str,
        outer_name: str,
        inner_value: float,
        middle_value: float,
        outer_value: float,
    ) -> tuple[float, float, float]:
        """Convert sampled inner/middle/outer values into an (x, y, z) point."""
        coordinates = {
            inner_name: inner_value,
            middle_name: middle_value,
            outer_name: outer_value,
        }
        return coordinates["x"], coordinates["y"], coordinates["z"]

    def build_visual_explanation(self, result: dict[str, object]) -> str:
        """Build the student-friendly explanation beside the box."""
        if self.is_one_function(result["function"]):
            return (
                "The sketch is scaled to your actual x, y, and z limits.\n\n"
                "Because f(x, y, z) = 1, every tiny 3D cell contributes equally, so the triple integral gives the "
                "volume of this region."
            )

        return (
            "The sketch is scaled to your actual x, y, and z limits.\n\n"
            "The box shows where the variables are allowed to move, while f(x, y, z) acts like a density or weight "
            "inside that region.\n\n"
            "So the triple integral adds up the total accumulated value over the full 3D region."
        )

    def build_variable_limit_explanation(self, result: dict[str, object]) -> str:
        """Explain a variable-dependent 3D region using the true order."""
        inner_name, middle_name, outer_name = result["variable_order"]
        inner_lower, inner_upper = result["limits"][inner_name]
        middle_lower, middle_upper = result["limits"][middle_name]
        outer_lower, outer_upper = result["limits"][outer_name]

        return (
            "This preview stacks sampled cross-sections from the actual entered bounds.\n\n"
            f"The outer variable is {outer_name}, which runs from {sp.sstr(outer_lower)} to {sp.sstr(outer_upper)}. "
            f"For each {outer_name}, {middle_name} runs from {sp.sstr(middle_lower)} to {sp.sstr(middle_upper)}, "
            f"and {inner_name} runs from {sp.sstr(inner_lower)} to {sp.sstr(inner_upper)}.\n\n"
            "That is why the region changes size from slice to slice instead of staying a simple rectangular box."
        )
