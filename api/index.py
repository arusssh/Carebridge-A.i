import os
import sys
from pathlib import Path

# Add project root directory to sys.path so backend modules can be imported
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.main import app
