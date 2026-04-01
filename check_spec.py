#!/usr/bin/env python3
import paramiko

HOST = "10.100.14.69"
USERNAME = "aan"
PASSWORD = "Sementara3"

def run_cmd(ssh, cmd, label=""):
    if label:
        print(f"\n{'='*40}\n{label}\n{'='*40}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    out = stdout.read().decode('utf-8', errors='replace')
    print(out.encode('ascii', errors='replace').decode('ascii'))

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=22, username=USERNAME, password=PASSWORD, timeout=10)

run_cmd(ssh, "lsb_release -d", "OS")
run_cmd(ssh, "nproc && lscpu | grep -E 'Model name|CPU\\(s\\):|Thread|Core'", "CPU")
run_cmd(ssh, "free -h", "RAM")
run_cmd(ssh, "df -h", "DISK")
run_cmd(ssh, "echo 'Sementara3' | sudo -S docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'", "DOCKER CONTAINERS")
run_cmd(ssh, "echo 'Sementara3' | sudo -S docker system df", "DOCKER DISK USAGE")

ssh.close()
