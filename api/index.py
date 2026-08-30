import sys
import os

# Add backend directory to sys.path so app modules are discoverable by Vercel
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.main import app

# Vercel looks for the ASGI application object 'app'
