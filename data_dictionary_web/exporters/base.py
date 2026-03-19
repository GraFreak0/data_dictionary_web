"""
exporters/base.py
=================
Abstract base class for Data Dictionary exporters.

To create a new exporter format:
  1. Create a new file in this directory, e.g. exporters/my_format.py
  2. Subclass BaseExporter and implement all abstract methods
  3. That's it — app.py auto-discovers all BaseExporter subclasses at startup

The exporter receives the full filtered data dict and the requesting user,
and must return raw bytes + a MIME type + a suggested filename extension.

Example skeleton
----------------
from exporters.base import BaseExporter

class MyFormatExporter(BaseExporter):
    name        = "myformat"           # used in API: POST /api/export {format: "myformat"}
    label       = "My Format"          # shown in UI
    mime_type   = "application/octet-stream"
    extension   = ".bin"

    def export(self, data: dict, user, export_type: str, resources: list) -> bytes:
        # data["schemas"] = [
        #     {
        #         "name": "schema_name",
        #         "tables": [
        #             {
        #                 "name": "table_name",
        #                 "description": "...",
        #                 "columns": [
        #                     {"name": "col", "data_type": "TEXT", "description": "..."},
        #                     ...
        #                 ]
        #             },
        #             ...
        #         ]
        #     },
        #     ...
        # ]
        # data["meta"] = {"generated_by": user.username, "generated_at": "...", ...}
        raise NotImplementedError
"""

from abc import ABC, abstractmethod


class BaseExporter(ABC):
    """
    All exporters must subclass this and implement `export()`.

    Class attributes (set on your subclass):
        name      (str)  — unique identifier, used in the API  e.g. "pdf", "csv"
        label     (str)  — human-readable name shown in the UI e.g. "PDF Document"
        mime_type (str)  — HTTP Content-Type for the response
        extension (str)  — file extension including dot         e.g. ".pdf", ".csv"
    """

    # Override these in every subclass
    name:      str = ""
    label:     str = ""
    mime_type: str = "application/octet-stream"
    extension: str = ".bin"

    @abstractmethod
    def export(self, data: dict, user, export_type: str, resources: list) -> bytes:
        """
        Generate the export and return raw bytes.

        Parameters
        ----------
        data : dict
            {
                "meta": {
                    "generated_by": str,
                    "generated_at": str,   # ISO datetime string
                    "export_type":  str,   # "full" | "filtered"
                },
                "schemas": [
                    {
                        "name": str,
                        "tables": [
                            {
                                "name":        str,
                                "description": str,
                                "columns": [
                                    {
                                        "name":        str,
                                        "data_type":   str,
                                        "description": str,
                                    },
                                    ...
                                ],
                            },
                            ...
                        ],
                    },
                    ...
                ],
            }
        user : User
            The Flask-Login user object requesting the export.
        export_type : str
            "full" or "filtered" (informational — data is already filtered).
        resources : list
            The original list of requested resources (informational).

        Returns
        -------
        bytes
            Raw file content ready to be streamed to the client.
        """
        raise NotImplementedError
