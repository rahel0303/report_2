#!/usr/bin/env python3
import paramiko
import time

HOST = "10.100.14.129"
PORT = 22
USERNAME = "affa"
PASSWORD = "Admin@2025"

def run_cmd(ssh, cmd, timeout=60):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out[-1000:].encode('ascii', errors='replace').decode('ascii'))
    if err:
        print("STDERR:", err[-500:].encode('ascii', errors='replace').decode('ascii'))
    return out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD, timeout=30)
    print("Connected!")

    # Stop and remove old report-app (port 3000)
    print("\n--- Stopping old report-app ---")
    run_cmd(ssh, "docker stop report-app 2>/dev/null || true")
    run_cmd(ssh, "docker rm report-app 2>/dev/null || true")

    # Stop and remove new report2-app (port 3001)
    print("\n--- Stopping report2-app (port 3001) ---")
    run_cmd(ssh, "docker stop report2-app 2>/dev/null || true")
    run_cmd(ssh, "docker rm report2-app 2>/dev/null || true")

    # Re-run report2-app on port 3000
    print("\n--- Starting report2-app on port 3000 ---")
    run_cmd(ssh,
        "docker run -d --name report2-app --restart unless-stopped "
        "-p 3000:3000 "
        "--env-file /home/affa/report2/.env.local "
        "report2-app",
        timeout=30
    )

    time.sleep(3)
    run_cmd(ssh, "docker ps")
    run_cmd(ssh, "docker logs report2-app --tail 10")

    ssh.close()
    print(f"\n=== Done! App running at http://{HOST}:3000 ===")

if __name__ == "__main__":
    main()
