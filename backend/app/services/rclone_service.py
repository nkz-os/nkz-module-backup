import os
import subprocess
import tempfile
import json
from typing import Dict, Any

class RcloneService:
    def __init__(self):
        self.rclone_bin = "rclone"

    def _generate_config_file(self, config: Dict[str, Any]) -> str:
        """
        Generates a temporary rclone.conf file content based on the provided configuration.
        The config dict should match Rclone's expectations for different remotes.
        """
        remote_name = "target"
        config_content = f"[{remote_name}]\n"
        
        # Common fields
        type_ = config.get("type")
        if not type_:
            raise ValueError("Missing 'type' in destination config")
            
        config_content += f"type = {type_}\n"
        
        # Add all other fields key=value
        for key, value in config.items():
            if key == "type":
                continue
            # Handle boolean values for rclone (true/false)
            if isinstance(value, bool):
                value = "true" if value else "false"
            config_content += f"{key} = {value}\n"
            
        return config_content

    async def test_connection(self, config: Dict[str, Any]) -> bool:
        """
        Validates connection to the remote storage.
        """
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as tmp_conf:
            conf_content = self._generate_config_file(config)
            tmp_conf.write(conf_content)
            tmp_conf_path = tmp_conf.name
            
        try:
            # Run rclone lsd target: to check connectivity
            # --config points to our temp file
            cmd = [
                self.rclone_bin,
                "--config", tmp_conf_path,
                "lsd", "target:",
                "--connect-timeout", "10s"
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode != 0:
                print(f"Rclone connection check failed: {result.stderr}")
                return False
                
            return True
            
        except Exception as e:
            print(f"Rclone execution error: {str(e)}")
            return False
            
        finally:
            if os.path.exists(tmp_conf_path):
                os.remove(tmp_conf_path)

    def get_repo_path(self, destination_config: Dict[str, Any]) -> str:
        """
        Returns the Restic repository string (rclone:target:bucket/path)
        """
        # We don't need the full config here, just the path structure
        # In the worker, rclone is configured as 'target' remote
        bucket = destination_config.get("bucket", "")
        path = destination_config.get("path", "")
        
        full_path = f"{bucket}/{path}".strip("/")
        return f"rclone:target:{full_path}"
