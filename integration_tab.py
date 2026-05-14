"""Tkinter tabs for double and triple integration tools."""

from __future__ import annotations

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
        self.visual_text_var.set(
            "The graph view shades the x-y region between your limits.\n\n"
            "For f(x, y) = 1, the double integral counts the area of that region.\n\n"
            "For other functions, imagine thin vertical columns above the shaded base. "
            "Adding all those column volumes gives the double integral."
        )

        self.visual_canvas.create_line(40, 190, 320, 190, fill="#1f2d3d", width=2)
        self.visual_canvas.create_line(70, 205, 70, 35, fill="#1f2d3d", width=2)
        self.visual_canvas.create_rectangle(120, 105, 250, 170, fill="#d7e8ff", outline="#2d6cdf", width=2)
        self.visual_canvas.create_text(185, 88, text="Shaded x-y region", font=("Arial", 10, "bold"), fill="#2d6cdf")
        self.visual_canvas.create_text(325, 205, text="x", font=("Arial", 10, "bold"), fill="#1f2d3d")
        self.visual_canvas.create_text(58, 30, text="y", font=("Arial", 10, "bold"), fill="#1f2d3d")

    def draw_visual_for_result(self, result: dict[str, object]) -> None:
        """Draw the shaded region and a simple volume sketch."""
        self.clear_visual_canvas()

        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]
        x_lower_value = self.expr_to_float(x_lower, -1.0)
        x_upper_value = self.expr_to_float(x_upper, 1.0)
        y_lower_value = self.expr_to_float(y_lower, -1.0)
        y_upper_value = self.expr_to_float(y_upper, 1.0)

        x_min = min(0.0, x_lower_value, x_upper_value)
        x_max = max(0.0, x_lower_value, x_upper_value)
        y_min = min(0.0, y_lower_value, y_upper_value)
        y_max = max(0.0, y_lower_value, y_upper_value)
        x_min, x_max = self.clamp_range(x_min, x_max)
        y_min, y_max = self.clamp_range(y_min, y_max)

        left_margin = 44
        right_margin = 330
        top_margin = 28
        bottom_margin = 202

        def map_x(value: float) -> float:
            return left_margin + (value - x_min) * (right_margin - left_margin) / (x_max - x_min)

        def map_y(value: float) -> float:
            return bottom_margin - (value - y_min) * (bottom_margin - top_margin) / (y_max - y_min)

        zero_x = map_x(0.0) if x_min <= 0.0 <= x_max else left_margin
        zero_y = map_y(0.0) if y_min <= 0.0 <= y_max else bottom_margin
        self.visual_canvas.create_line(left_margin, zero_y, right_margin, zero_y, fill="#1f2d3d", width=2)
        self.visual_canvas.create_line(zero_x, bottom_margin, zero_x, top_margin, fill="#1f2d3d", width=2)
        self.visual_canvas.create_text(right_margin + 12, zero_y + 10, text="x", font=("Arial", 10, "bold"), fill="#1f2d3d")
        self.visual_canvas.create_text(zero_x - 10, top_margin - 10, text="y", font=("Arial", 10, "bold"), fill="#1f2d3d")

        rect_left = map_x(x_lower_value)
        rect_right = map_x(x_upper_value)
        rect_top = map_y(y_upper_value)
        rect_bottom = map_y(y_lower_value)
        self.visual_canvas.create_rectangle(
            rect_left,
            rect_top,
            rect_right,
            rect_bottom,
            fill="#d7e8ff",
            outline="#2d6cdf",
            width=2,
        )

        self.visual_canvas.create_text(rect_left, zero_y + 16, text=sp.sstr(x_lower), anchor="n", font=("Arial", 9))
        self.visual_canvas.create_text(rect_right, zero_y + 16, text=sp.sstr(x_upper), anchor="n", font=("Arial", 9))
        self.visual_canvas.create_text(zero_x - 10, rect_bottom, text=sp.sstr(y_lower), anchor="e", font=("Arial", 9))
        self.visual_canvas.create_text(zero_x - 10, rect_top, text=sp.sstr(y_upper), anchor="e", font=("Arial", 9))

        expression_is_one = sp.simplify(result["function"] - 1) == 0
        if expression_is_one:
            self.visual_canvas.create_text(
                (rect_left + rect_right) / 2,
                rect_top - 12,
                text="Area region",
                font=("Arial", 10, "bold"),
                fill="#2d6cdf",
            )
        else:
            shift_x = 34
            shift_y = -26
            top_points = [
                rect_left + shift_x,
                rect_top + shift_y,
                rect_right + shift_x,
                rect_top + shift_y,
                rect_right + shift_x,
                rect_bottom + shift_y,
                rect_left + shift_x,
                rect_bottom + shift_y,
            ]
            self.visual_canvas.create_polygon(
                *top_points,
                fill="#c5d9ff",
                outline="#1e63d6",
                width=2,
            )
            for start_x, start_y, end_x, end_y in (
                (rect_left, rect_top, rect_left + shift_x, rect_top + shift_y),
                (rect_right, rect_top, rect_right + shift_x, rect_top + shift_y),
                (rect_right, rect_bottom, rect_right + shift_x, rect_bottom + shift_y),
                (rect_left, rect_bottom, rect_left + shift_x, rect_bottom + shift_y),
            ):
                self.visual_canvas.create_line(start_x, start_y, end_x, end_y, fill="#1e63d6", dash=(4, 2))

            self.visual_canvas.create_text(
                rect_right + shift_x - 6,
                rect_top + shift_y - 12,
                text="z = f(x, y)",
                font=("Arial", 10, "bold"),
                fill="#1e63d6",
            )

        self.visual_text_var.set(self.build_visual_explanation(result))

    def build_visual_explanation(self, result: dict[str, object]) -> str:
        """Build the student-friendly explanation beside the graph."""
        expression_is_one = sp.simplify(result["function"] - 1) == 0
        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]

        if expression_is_one:
            return (
                "The shaded rectangle is the x-y region you are integrating over.\n\n"
                f"It runs from x = {sp.sstr(x_lower)} to x = {sp.sstr(x_upper)} and "
                f"from y = {sp.sstr(y_lower)} to y = {sp.sstr(y_upper)}.\n\n"
                "Because f(x, y) = 1, every tiny piece of the region has height 1, "
                "so the double integral gives the area of the rectangle."
            )

        return (
            "The shaded rectangle is the base region in the x-y plane.\n\n"
            "The lifted blue top suggests the surface z = f(x, y) above that base.\n\n"
            "A double integral adds many thin vertical columns over the shaded region. "
            "Adding all of those small column volumes gives the total volume under the surface."
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
            "The graph view shows the 3D region bounded by your x, y, and z limits.\n\n"
            "A triple integral adds up many tiny volume cells inside that 3D box.\n\n"
            "If f(x, y, z) = 1, the answer is the volume. Otherwise it is the total accumulated value over the region."
        )

        front_left = (92, 155)
        front_right = (222, 155)
        front_top_left = (92, 80)
        front_top_right = (222, 80)
        offset = (52, -34)
        back_left = (front_left[0] + offset[0], front_left[1] + offset[1])
        back_right = (front_right[0] + offset[0], front_right[1] + offset[1])
        back_top_left = (front_top_left[0] + offset[0], front_top_left[1] + offset[1])
        back_top_right = (front_top_right[0] + offset[0], front_top_right[1] + offset[1])

        self.visual_canvas.create_rectangle(*front_top_left, *front_right, outline="#2d6cdf", width=2)
        self.visual_canvas.create_rectangle(*back_top_left, *back_right, outline="#2d6cdf", width=2)
        for start_point, end_point in (
            (front_left, back_left),
            (front_right, back_right),
            (front_top_left, back_top_left),
            (front_top_right, back_top_right),
        ):
            self.visual_canvas.create_line(*start_point, *end_point, fill="#2d6cdf", width=2)

        self.visual_canvas.create_text(295, 58, text="3D region", font=("Arial", 10, "bold"), fill="#2d6cdf")
        self.visual_canvas.create_text(246, 168, text="x", font=("Arial", 10, "bold"), fill="#1f2d3d")
        self.visual_canvas.create_text(72, 72, text="z", font=("Arial", 10, "bold"), fill="#1f2d3d")
        self.visual_canvas.create_text(284, 126, text="y", font=("Arial", 10, "bold"), fill="#1f2d3d")

    def draw_visual_for_result(self, result: dict[str, object]) -> None:
        """Draw a cuboid that represents the integration region."""
        self.clear_visual_canvas()

        x_lower, x_upper = result["limits"]["x"]
        y_lower, y_upper = result["limits"]["y"]
        z_lower, z_upper = result["limits"]["z"]

        x_span = abs(self.expr_to_float(x_upper, 1.0) - self.expr_to_float(x_lower, 0.0))
        y_span = abs(self.expr_to_float(y_upper, 1.0) - self.expr_to_float(y_lower, 0.0))
        z_span = abs(self.expr_to_float(z_upper, 1.0) - self.expr_to_float(z_lower, 0.0))
        max_span = max(x_span, y_span, z_span, 1.0)

        front_width = 90 + 70 * (x_span / max_span)
        front_height = 55 + 55 * (z_span / max_span)
        offset_x = 42 + 34 * (y_span / max_span)
        offset_y = 26 + 18 * (y_span / max_span)

        left = 86
        bottom = 182
        right = left + front_width
        top = bottom - front_height

        front_left = (left, bottom)
        front_right = (right, bottom)
        front_top_left = (left, top)
        front_top_right = (right, top)
        back_left = (left + offset_x, bottom - offset_y)
        back_right = (right + offset_x, bottom - offset_y)
        back_top_left = (left + offset_x, top - offset_y)
        back_top_right = (right + offset_x, top - offset_y)

        self.visual_canvas.create_polygon(
            front_top_left[0],
            front_top_left[1],
            front_top_right[0],
            front_top_right[1],
            back_top_right[0],
            back_top_right[1],
            back_top_left[0],
            back_top_left[1],
            fill="#d7e8ff",
            outline="#2d6cdf",
            width=2,
        )
        self.visual_canvas.create_polygon(
            front_top_right[0],
            front_top_right[1],
            back_top_right[0],
            back_top_right[1],
            back_right[0],
            back_right[1],
            front_right[0],
            front_right[1],
            fill="#c5d9ff",
            outline="#2d6cdf",
            width=2,
        )
        self.visual_canvas.create_rectangle(
            front_top_left[0],
            front_top_left[1],
            front_right[0],
            front_right[1],
            fill="#eef5ff",
            outline="#2d6cdf",
            width=2,
        )
        for start_point, end_point in (
            (front_left, back_left),
            (front_top_left, back_top_left),
            (front_top_right, back_top_right),
            (front_right, back_right),
        ):
            self.visual_canvas.create_line(*start_point, *end_point, fill="#2d6cdf", width=2)

        expression_is_one = sp.simplify(result["function"] - 1) == 0
        label_text = "Volume region" if expression_is_one else "Accumulation region"
        self.visual_canvas.create_text(290, 42, text=label_text, font=("Arial", 10, "bold"), fill="#2d6cdf")
        self.visual_canvas.create_text(right + 14, bottom + 8, text=f"x: {sp.sstr(x_lower)} to {sp.sstr(x_upper)}", anchor="w", font=("Arial", 9))
        self.visual_canvas.create_text(back_right[0] + 12, back_right[1] - 6, text=f"y: {sp.sstr(y_lower)} to {sp.sstr(y_upper)}", anchor="w", font=("Arial", 9))
        self.visual_canvas.create_text(left - 6, top - 10, text=f"z: {sp.sstr(z_lower)} to {sp.sstr(z_upper)}", anchor="e", font=("Arial", 9))

        self.visual_text_var.set(self.build_visual_explanation(result))

    def build_visual_explanation(self, result: dict[str, object]) -> str:
        """Build the student-friendly explanation beside the cuboid."""
        expression_is_one = sp.simplify(result["function"] - 1) == 0
        if expression_is_one:
            return (
                "The box shows the full 3D region bounded by your x, y, and z limits.\n\n"
                "A triple integral with f(x, y, z) = 1 counts every tiny volume cell inside that box.\n\n"
                "That is why the final answer is the volume of the 3D region."
            )

        return (
            "The box shows the region in space where x, y, and z are allowed to vary.\n\n"
            "A triple integral adds the value of f(x, y, z) over many tiny volume cells inside that region.\n\n"
            "So the answer is the total accumulated value over the full 3D box, not just the box volume."
        )
