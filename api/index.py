import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") in ("http", "websocket"):
        path = scope.get("path", "")
        # Normalize rewritten paths from Vercel
        if path.startswith("/api/index.py"):
            suffix = path[len("/api/index.py"):]
            scope["path"] = "/api" + (suffix if suffix.startswith("/") else ("/" + suffix if suffix else ""))
        elif not path.startswith("/api"):
            scope["path"] = "/api" + (path if path.startswith("/") else "/" + path)
    await fastapi_app(scope, receive, send)
