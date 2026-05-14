"""Symbolic integration helpers for SmartGraph."""

from __future__ import annotations

from typing import Sequence

import sympy as sp

x, y, z = sp.symbols("x y z")
SYMBOLS = {"x": x, "y": y, "z": z}
SAFE_NAMES = {
    "x": x,
    "y": y,
    "z": z,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "exp": sp.exp,
    "sqrt": sp.sqrt,
    "log": sp.log,
    "ln": sp.log,
    "Abs": sp.Abs,
    "pi": sp.pi,
    "e": sp.E,
    "E": sp.E,
}


def parse_function(expression: str, variables: Sequence[str]) -> sp.Expr:
    """Parse a function string into a SymPy expression."""
    cleaned_expression = (expression or "").strip().replace("^", "**")
    if not cleaned_expression:
        raise ValueError("Please enter a valid function such as x + y.")

    try:
        parsed_expression = sp.sympify(cleaned_expression, locals=SAFE_NAMES)
    except (sp.SympifyError, TypeError):
        raise ValueError("Please enter a valid function such as x + y.") from None

    invalid_symbols = sorted(
        {str(symbol) for symbol in parsed_expression.free_symbols if str(symbol) not in variables}
    )
    if invalid_symbols:
        expected_variables = ", ".join(variables)
        raise ValueError(
            f"Unsupported variables found. Please use only {expected_variables}."
        )

    if parsed_expression.has(sp.zoo, sp.nan, sp.oo, -sp.oo):
        raise ValueError("The function contains an undefined value. Please revise it.")

    return sp.simplify(parsed_expression)


def calculate_double_integral(
    function_text: str,
    x_lower_text: str,
    x_upper_text: str,
    y_lower_text: str,
    y_upper_text: str,
    order: str,
) -> dict[str, object]:
    """Calculate a double integral with step-by-step details."""
    expression = parse_function(function_text, ("x", "y"))

    if order == "dx dy":
        variable_order = ("x", "y")
    elif order == "dy dx":
        variable_order = ("y", "x")
    else:
        raise ValueError("Please choose a valid integration order.")

    limit_texts = {
        "x": (x_lower_text, x_upper_text),
        "y": (y_lower_text, y_upper_text),
    }
    limits = _parse_limits(limit_texts, variable_order)
    _validate_sampled_region(limits, variable_order)

    step_results = _calculate_integral_steps(expression, variable_order, limits)
    final_answer = sp.simplify(step_results[-1]["result"])
    meaning = (
        "Since f(x, y) = 1, this result represents the area of the selected region."
        if sp.simplify(expression - 1) == 0
        else (
            "This represents the signed accumulation of f(x, y) over the selected region. "
            "When f(x, y) stays nonnegative, you can interpret it as the volume under z = f(x, y)."
        )
    )

    return {
        "kind": "double",
        "function": expression,
        "function_text": _expression_to_text(expression),
        "limits": limits,
        "order": order,
        "variable_order": variable_order,
        "steps": step_results,
        "final_answer": final_answer,
        "approximation": _optional_approximation(final_answer),
        "meaning": meaning,
        "has_variable_limits": _has_variable_limits(limits),
    }


def calculate_triple_integral(
    function_text: str,
    x_lower_text: str,
    x_upper_text: str,
    y_lower_text: str,
    y_upper_text: str,
    z_lower_text: str,
    z_upper_text: str,
    order: str,
) -> dict[str, object]:
    """Calculate a triple integral with step-by-step details."""
    expression = parse_function(function_text, ("x", "y", "z"))
    variable_order = _parse_triple_order(order)

    limit_texts = {
        "x": (x_lower_text, x_upper_text),
        "y": (y_lower_text, y_upper_text),
        "z": (z_lower_text, z_upper_text),
    }
    limits = _parse_limits(limit_texts, variable_order)
    _validate_sampled_region(limits, variable_order)

    step_results = _calculate_integral_steps(expression, variable_order, limits)
    final_answer = sp.simplify(step_results[-1]["result"])
    meaning = (
        "Since f(x, y, z) = 1, this result represents the volume of the selected 3D region."
        if sp.simplify(expression - 1) == 0
        else (
            "This represents the signed accumulated value of f(x, y, z) over the selected 3D region. "
            "When f(x, y, z) is nonnegative, you can interpret it as a total density or total mass."
        )
    )

    return {
        "kind": "triple",
        "function": expression,
        "function_text": _expression_to_text(expression),
        "limits": limits,
        "order": order,
        "variable_order": variable_order,
        "steps": step_results,
        "final_answer": final_answer,
        "approximation": _optional_approximation(final_answer),
        "meaning": meaning,
        "has_variable_limits": _has_variable_limits(limits),
    }


def format_integration_steps(result: dict[str, object]) -> str:
    """Format integration results in a student-friendly way."""
    function_text = str(result["function_text"])
    lines = [
        "Given:",
        (
            f"f(x, y) = {function_text}"
            if result["kind"] == "double"
            else f"f(x, y, z) = {function_text}"
        ),
        "",
        "Limits:",
    ]

    limits = dict(result["limits"])
    for variable_name in sorted(limits.keys()):
        lower_value, upper_value = limits[variable_name]
        lines.append(
            f"{variable_name}: {_expression_to_text(lower_value)} to {_expression_to_text(upper_value)}"
        )

    if result.get("has_variable_limits"):
        lines.extend(
            [
                "",
                "Note:",
                "Some limits depend on outer variables, so the integration region changes shape as you move through it.",
            ]
        )

    lines.extend(
        [
            "",
            "Integral Setup:",
            _build_integral_setup(result),
            "",
        ]
    )

    for step_index, step in enumerate(result["steps"], start=1):
        variable_name = str(step["variable"])
        lower_value = step["lower"]
        upper_value = step["upper"]
        step_title = _step_label(step_index, len(result["steps"]))
        lines.append(f"{step_title}:")
        lines.append(f"Integrate with respect to {variable_name}.")
        lines.append(
            f"Result after integrating from {variable_name} = "
            f"{_expression_to_text(lower_value)} to {_expression_to_text(upper_value)}:"
        )
        lines.append(_expression_to_text(step["result"]))
        lines.append("")

    lines.append("Final Answer:")
    lines.append(_expression_to_text(result["final_answer"]))

    approximation = result["approximation"]
    if approximation is not None:
        lines.extend(["", f"Decimal Approximation: {approximation}"])

    lines.extend(["", "Meaning:", str(result["meaning"])])
    return "\n".join(lines)


def _parse_limits(
    limit_texts: dict[str, tuple[str, str]],
    variable_order: Sequence[str],
) -> dict[str, tuple[sp.Expr, sp.Expr]]:
    """Parse integration limits while allowing dependence on outer variables."""
    limits: dict[str, tuple[sp.Expr, sp.Expr]] = {}

    for index, variable_name in enumerate(variable_order):
        lower_text, upper_text = limit_texts[variable_name]
        allowed_variables = tuple(variable_order[index + 1 :])
        lower_limit = _parse_limit(lower_text, allowed_variables)
        upper_limit = _parse_limit(upper_text, allowed_variables)
        _validate_limit_order(lower_limit, upper_limit, allowed_variables)
        limits[variable_name] = (lower_limit, upper_limit)

    return limits


def _parse_limit(limit_text: str, allowed_variables: Sequence[str]) -> sp.Expr:
    """Parse one limit expression, allowing only selected variables."""
    cleaned_text = (limit_text or "").strip().replace("^", "**")
    if not cleaned_text:
        raise ValueError("Please enter valid limits. You can use outer variables in bounds.")

    try:
        limit_value = sp.sympify(cleaned_text, locals=SAFE_NAMES)
    except (sp.SympifyError, TypeError):
        raise ValueError("Please enter valid limits. You can use outer variables in bounds.") from None

    invalid_symbols = sorted(
        {str(symbol) for symbol in limit_value.free_symbols if str(symbol) not in allowed_variables}
    )
    if invalid_symbols:
        if allowed_variables:
            expected = ", ".join(allowed_variables)
            raise ValueError(
                f"These bounds can only use the outer variables: {expected}."
            )
        raise ValueError("The outermost limits must be constants, not variable expressions.")

    limit_value = sp.simplify(limit_value)
    if limit_value.has(sp.zoo, sp.nan, sp.oo, -sp.oo):
        raise ValueError("The limits contain an undefined value.")

    if not limit_value.free_symbols and limit_value.is_real is False:
        raise ValueError("Please enter real numeric limits.")

    return limit_value


def _validate_limit_order(
    lower_limit: sp.Expr,
    upper_limit: sp.Expr,
    allowed_variables: Sequence[str],
) -> None:
    """Check that the lower limit is not greater than the upper limit."""
    difference = sp.simplify(upper_limit - lower_limit)

    if not difference.free_symbols:
        try:
            if float(sp.N(difference)) < 0:
                raise ValueError("The lower limit cannot be greater than the upper limit.")
            return
        except (TypeError, ValueError):
            raise ValueError("Please enter valid limits. You can use outer variables in bounds.") from None

    invalid_symbols = sorted(
        {str(symbol) for symbol in difference.free_symbols if str(symbol) not in allowed_variables}
    )
    if invalid_symbols:
        raise ValueError("Please check the limit expressions. They use unsupported variables.")

    if difference.is_negative:
        raise ValueError("The lower limit cannot be greater than the upper limit.")


def _validate_sampled_region(
    limits: dict[str, tuple[sp.Expr, sp.Expr]],
    variable_order: Sequence[str],
) -> None:
    """Check sampled points so nested bounds stay ordered throughout the region."""
    outer_to_inner = list(reversed(variable_order))
    _validate_bounds_recursively(outer_to_inner, limits, {})


def _validate_bounds_recursively(
    remaining_variables: list[str],
    limits: dict[str, tuple[sp.Expr, sp.Expr]],
    assignments: dict[str, float],
) -> None:
    """Recursively sample nested limits from outer variables toward inner variables."""
    if not remaining_variables:
        return

    variable_name = remaining_variables[0]
    lower_limit, upper_limit = limits[variable_name]
    lower_value = _evaluate_numeric_expression(lower_limit, assignments)
    upper_value = _evaluate_numeric_expression(upper_limit, assignments)

    if lower_value is None or upper_value is None:
        raise ValueError(
            "The limits could not be evaluated over the selected region. Please revise the bounds."
        )

    if lower_value > upper_value + 1e-9:
        raise ValueError(
            "The lower limit becomes greater than the upper limit inside the selected region."
        )

    if len(remaining_variables) == 1:
        return

    sample_count = 7 if not assignments else 5
    for sampled_value in _sample_interval(lower_value, upper_value, sample_count):
        next_assignments = dict(assignments)
        next_assignments[variable_name] = sampled_value
        _validate_bounds_recursively(remaining_variables[1:], limits, next_assignments)


def _sample_interval(lower_value: float, upper_value: float, count: int) -> list[float]:
    """Return evenly spaced values in a numeric interval."""
    if count <= 1 or abs(upper_value - lower_value) < 1e-9:
        return [lower_value]

    step = (upper_value - lower_value) / (count - 1)
    return [lower_value + step * index for index in range(count)]


def _evaluate_numeric_expression(expression: sp.Expr, assignments: dict[str, float]) -> float | None:
    """Evaluate an expression numerically at sampled variable values."""
    try:
        substituted = expression.subs({SYMBOLS[name]: value for name, value in assignments.items()})
        numeric_value = complex(sp.N(substituted))
    except (TypeError, ValueError, ZeroDivisionError):
        return None

    if abs(numeric_value.imag) > 1e-7:
        return None
    if not sp.Float(numeric_value.real).is_finite:
        return None
    return float(numeric_value.real)


def _parse_triple_order(order: str) -> tuple[str, str, str]:
    """Convert an order string such as 'dx dy dz' into variable names."""
    tokens = [token.strip() for token in order.split() if token.strip()]
    if len(tokens) != 3 or any(not token.startswith("d") for token in tokens):
        raise ValueError("Please choose a valid integration order.")

    variable_order = tuple(token[1:] for token in tokens)
    if sorted(variable_order) != ["x", "y", "z"]:
        raise ValueError("Please choose a valid integration order.")

    return variable_order


def _calculate_integral_steps(
    expression: sp.Expr,
    variable_order: Sequence[str],
    limits: dict[str, tuple[sp.Expr, sp.Expr]],
) -> list[dict[str, object]]:
    """Integrate one variable at a time and store each result."""
    steps: list[dict[str, object]] = []
    current_expression = expression

    for variable_name in variable_order:
        lower_limit, upper_limit = limits[variable_name]
        symbol = SYMBOLS[variable_name]
        integrated_result = sp.integrate(current_expression, (symbol, lower_limit, upper_limit))

        if isinstance(integrated_result, sp.Integral) or integrated_result.has(sp.Integral):
            integrated_result = sp.N(
                sp.Integral(current_expression, (symbol, lower_limit, upper_limit))
            )

        integrated_result = sp.simplify(integrated_result)
        if integrated_result.has(sp.zoo, sp.nan, sp.oo, -sp.oo):
            raise ValueError(
                "The calculation reached an undefined value. Check the function and limits."
            )

        steps.append(
            {
                "variable": variable_name,
                "lower": lower_limit,
                "upper": upper_limit,
                "result": integrated_result,
            }
        )
        current_expression = integrated_result

    return steps


def _build_integral_setup(result: dict[str, object]) -> str:
    """Create a readable nested integral setup string."""
    function_text = str(result["function_text"])
    limits = dict(result["limits"])
    variable_order = list(result["variable_order"])

    setup_text = function_text
    for variable_name in variable_order:
        lower_limit, upper_limit = limits[variable_name]
        setup_text = (
            f"Integral from {variable_name}={_expression_to_text(lower_limit)} "
            f"to {_expression_to_text(upper_limit)} of ({setup_text}) d{variable_name}"
        )

    return setup_text


def _step_label(step_index: int, total_steps: int) -> str:
    """Return a friendly label for a step."""
    if total_steps == 2:
        return "Step 1" if step_index == 1 else "Step 2"
    return f"Step {step_index}"


def _optional_approximation(expression: sp.Expr) -> str | None:
    """Return a decimal approximation when it adds useful context."""
    if expression.is_Integer:
        return None

    expression_text = _expression_to_text(expression)
    decimal_value = sp.N(expression, 8)
    decimal_text = _expression_to_text(decimal_value)

    if decimal_text == expression_text:
        return None

    return decimal_text


def _has_variable_limits(limits: dict[str, tuple[sp.Expr, sp.Expr]]) -> bool:
    """Return True when any bound depends on a variable."""
    for lower_limit, upper_limit in limits.values():
        if lower_limit.free_symbols or upper_limit.free_symbols:
            return True
    return False


def _expression_to_text(expression: sp.Expr) -> str:
    """Convert a SymPy expression to readable ASCII text."""
    return sp.sstr(sp.simplify(expression))
