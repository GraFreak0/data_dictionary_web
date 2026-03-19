"""
Entry point for:
  - `ddweb` CLI command
  - `python -m data_dictionary_web`
"""

import click
from data_dictionary_web import run, __version__


@click.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(__version__, "-V", "--version")
@click.option("--host", default="0.0.0.0", show_default=True,
              help="Network interface to bind to.")
@click.option("--port", default=5002, show_default=True, type=int,
              help="TCP port to listen on.")
@click.option("--yaml-dir", default=None, envvar="YAML_DIRECTORY",
              help="Path to the directory containing YAML schema files.")
@click.option("--database", default=None, envvar="DATABASE",
              help="Path to the SQLite database file.")
@click.option("--debug", is_flag=True, default=False,
              help="Enable Flask debug mode (auto-reload, verbose errors).")
def main(host, port, yaml_dir, database, debug):
    """Data Dictionary Web UI — self-hosted data catalog server.

    \b
    Quick start:
      ddweb                          # defaults: 0.0.0.0:5002
      ddweb --port 8080
      ddweb --yaml-dir ./dbt_models --database ./catalog.db

    \b
    Then open http://localhost:<port> and log in with admin / admin123.
    Change the admin password immediately after first login!
    """
    run(host=host, port=port, yaml_dir=yaml_dir, database=database, debug=debug)


if __name__ == "__main__":
    main()
