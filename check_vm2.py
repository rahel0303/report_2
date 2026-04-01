#!/usr/bin/env python3
import paramiko

HOST = "10.100.14.69"
PORT = 22
USERNAME = "aan"
PASSWORD = "Sementara3"

def run_cmd(ssh, cmd, timeout=30):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    combined = (out + err).encode('ascii', errors='replace').decode('ascii')
    print(combined[:2000])
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD, timeout=15)
print("=== Connected to VM 10.100.14.69 ===")

run_cmd(ssh, "uname -a")
run_cmd(ssh, "lsb_release -a 2>/dev/null || cat /etc/os-release | head -5")
run_cmd(ssh, "free -h")
run_cmd(ssh, "df -h /")
run_cmd(ssh, "nproc")
run_cmd(ssh, "docker --version 2>/dev/null || echo 'Docker NOT installed'")
run_cmd(ssh, "docker ps 2>/dev/null || echo 'Docker not running or no permission'")
run_cmd(ssh, "ss -tlnp | grep -E ':(80|443|3000|8080|8443)' || echo 'No common ports in use'")
run_cmd(ssh, "ss -tlnp 2>/dev/null | head -20")
run_cmd(ssh, "which nginx 2>/dev/null && nginx -v 2>&1 || echo 'Nginx not installed'")
run_cmd(ssh, "which caddy 2>/dev/null || echo 'Caddy not installed'")
run_cmd(ssh, "id")
run_cmd(ssh, "sudo -n true 2>/dev/null && echo 'Has sudo (nopasswd)' || echo 'sudo requires password'")

ssh.close()
print("\n=== Done ===")
