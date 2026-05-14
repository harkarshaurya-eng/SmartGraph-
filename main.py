"""Entry point for the SmartGraph desktop application."""

import tkinter as tk

from graph_app import SmartGraphApp


def main() -> None:
    """Create the Tkinter window and start the app."""
    root = tk.Tk()
    SmartGraphApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
