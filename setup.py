from setuptools import setup
from setuptools.command.build_py import build_py
from setuptools.command.sdist import sdist
import subprocess
import os
import sys

def build_frontend():
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')
    # If the frontend directory exists and has a package.json, we are in a source checkout
    if os.path.exists(os.path.join(frontend_dir, 'package.json')):
        npm_cmd = 'npm.cmd' if os.name == 'nt' else 'npm'
        try:
            print("Building frontend assets with npm...")
            subprocess.check_call([npm_cmd, 'install'], cwd=frontend_dir)
            subprocess.check_call([npm_cmd, 'run', 'build'], cwd=frontend_dir)
            print("Frontend assets built successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Error building frontend: {e}")
            sys.exit(1)
        except FileNotFoundError:
            print("Error: 'npm' command not found. Node.js and npm are required to build the frontend from source.")
            sys.exit(1)

class CustomBuildPy(build_py):
    def run(self):
        build_frontend()
        super().run()

class CustomSdist(sdist):
    def run(self):
        build_frontend()
        super().run()

setup(
    cmdclass={
        'build_py': CustomBuildPy,
        'sdist': CustomSdist,
    }
)
