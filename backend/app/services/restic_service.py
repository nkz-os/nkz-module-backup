import subprocess
import json
import os
from typing import List, Dict, Any

class ResticService:
    def __init__(self):
        self.restic_bin = "restic"

    def _run_command(self, cmd: List[str], env: Dict[str, str]) -> Dict[str, Any]:
        """
        Executes a restic command and returns stdout/stderr/returncode
        """
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                env=env,
                timeout=60 # Most API ops should be fast (snapshots, check)
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def list_snapshots(self, repo_url: str, password: str, rclone_conf_path: str) -> List[Dict[str, Any]]:
        """
        Lists all snapshots in the repository as JSON.
        """
        env = os.environ.copy()
        env["RESTIC_PASSWORD"] = password
        env["RCLONE_CONFIG"] = rclone_conf_path
        
        cmd = [self.restic_bin, "-r", repo_url, "snapshots", "--json"]
        
        result = self._run_command(cmd, env)
        
        if not result["success"]:
            print(f"Error listing snapshots: {result.get('stderr') or result.get('error')}")
            return []
            
        try:
            return json.loads(result["stdout"])
        except json.JSONDecodeError:
            return []

    def init_repo(self, repo_url: str, password: str, rclone_conf_path: str) -> bool:
        """
        Initialize a new restic repository.
        """
        env = os.environ.copy()
        env["RESTIC_PASSWORD"] = password
        env["RCLONE_CONFIG"] = rclone_conf_path
        
        cmd = [self.restic_bin, "-r", repo_url, "init"]
        
        result = self._run_command(cmd, env)
        
        if result["success"]:
            return True
        
        # If it failed, check if it's because it already exists
        if "config file already exists" in result.get("stderr", ""):
            return True
            
        print(f"Error initializing repo: {result.get('stderr')}")
        return False

    def unlock_repo(self, repo_url: str, password: str, rclone_conf_path: str):
        """
        Removes stale locks.
        """
        env = os.environ.copy()
        env["RESTIC_PASSWORD"] = password
        env["RCLONE_CONFIG"] = rclone_conf_path
        
        cmd = [self.restic_bin, "-r", repo_url, "unlock"]
        self._run_command(cmd, env)
