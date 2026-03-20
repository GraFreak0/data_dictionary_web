"""
Data Dictionary Web UI
A self-hosted web application for exploring and governing your data catalog.
"""

__version__ = "0.1.1"
__author__ = "Isaiah Johnson"
__license__ = "MIT"

import os
import sys


def _get_resource_path(relative: str) -> str:
    """Return the absolute path to a package resource.
    Works both when installed as a wheel and when running from source."""
    package_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(package_dir, relative)


def run(host: str = "0.0.0.0", port: int = 5002, yaml_dir: str = None,
        database: str = None, debug: bool = False) -> None:
    """Start the Data Dictionary Web UI server.

    Args:
        host:      Network interface to bind to.
        port:      TCP port to listen on.
        yaml_dir:  Path to the YAML schema directory.
        database:  Path to the SQLite database file.
        debug:     Enable Flask debug / auto-reload mode.
    """
    # Resolve paths relative to the *caller's* working directory, not the
    # package directory, so the user's data files are found correctly.
    cwd = os.getcwd()

    if yaml_dir:
        os.environ.setdefault("YAML_DIRECTORY", yaml_dir)
    if database:
        os.environ.setdefault("DATABASE", database)

    # Import app here so env vars are visible before Flask reads config.
    from data_dictionary_web.server import app, CURRENT_BOOT_ID  # noqa: F401
    print(f"[ddweb] Starting on http://{host}:{port}")
    print(f"[ddweb] boot_id={CURRENT_BOOT_ID}")
    app.run(host=host, port=port, debug=debug)
