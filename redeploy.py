#!/usr/bin/env python3
import paramiko
import time
import os
import base64

configs = [
    {"host": "10.100.14.69", "user": "aan", "password": "Sementara3", "sudo": True},
]

LOCAL_TAR = os.path.expanduser("~/report-app.tar.gz")
LOCAL_ENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
REMOTE_TAR_TPL = "/home/{user}/report-app.tar.gz"
REMOTE_DIR_TPL = "/home/{user}/report2"
CONTAINER = "report2-app"
IMAGE = "report2-app"

def run(ssh, cmd, timeout=300, sudo=False, password=""):
    if sudo:
        cmd = f'echo "{password}" | sudo -S bash -c \'{cmd}\''
    print(f"$ {cmd[:80]}{'...' if len(cmd)>80 else ''}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    err_clean = '\n'.join(l for l in err.splitlines() if 'sudo' not in l.lower() and '[sudo]' not in l)
    print((out + err_clean)[-1500:].encode('ascii', errors='replace').decode('ascii'))
    return out

def read_env_key(env_path, key):
    """Read a specific key value from an env file."""
    if not os.path.exists(env_path):
        return ''
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key}='):
                return line.split('=', 1)[1].strip()
    return ''

for cfg in configs:
    host, user, pw = cfg['host'], cfg['user'], cfg['password']
    use_sudo = cfg['sudo']
    remote_tar = REMOTE_TAR_TPL.format(user=user)
    remote_dir = REMOTE_DIR_TPL.format(user=user)

    print(f"\n{'='*50}\nDeploying to {host}\n{'='*50}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=22, username=user, password=pw, timeout=15)

    # Upload tar + .env.local
    print(f"\nUploading {os.path.getsize(LOCAL_TAR)/1024/1024:.1f}MB...")
    sftp = ssh.open_sftp()
    sftp.put(LOCAL_TAR, remote_tar)
    if os.path.exists(LOCAL_ENV):
        print("Uploading .env.local...")
        sftp.put(LOCAL_ENV, f"/home/{user}/.env.local.tmp")
    sftp.close()

    # Extract
    run(ssh, f"rm -rf {remote_dir} && mkdir -p {remote_dir}")
    run(ssh, f"tar -xzf {remote_tar} -C {remote_dir}")

    # Place .env.local in remote_dir (override anything from tar)
    if os.path.exists(LOCAL_ENV):
        run(ssh, f"cp /home/{user}/.env.local.tmp {remote_dir}/.env.local")
        print(".env.local placed in remote dir")

    # Read NEXT_PUBLIC vars needed at build time
    gemini_key = read_env_key(LOCAL_ENV, 'NEXT_PUBLIC_GEMINI_API_KEY')
    if not gemini_key:
        print("WARNING: NEXT_PUBLIC_GEMINI_API_KEY not found in .env.local")

    # Stop old container
    run(ssh, f"docker stop {CONTAINER} 2>/dev/null || true", sudo=use_sudo, password=pw)
    run(ssh, f"docker rm {CONTAINER} 2>/dev/null || true", sudo=use_sudo, password=pw)

    # Build with NEXT_PUBLIC vars as build args
    print("\nBuilding Docker image...")
    run(ssh,
        f"cd {remote_dir} && docker build "
        f"--build-arg NEXT_PUBLIC_GEMINI_API_KEY={gemini_key} "
        f"-t {IMAGE} . 2>&1",
        timeout=600, sudo=use_sudo, password=pw)

    # Run
    run(ssh,
        f"docker run -d --name {CONTAINER} --restart unless-stopped "
        f"-p 3000:3000 --env-file {remote_dir}/.env.local {IMAGE}",
        sudo=use_sudo, password=pw)

    time.sleep(3)
    run(ssh, "docker ps", sudo=use_sudo, password=pw)
    run(ssh, f"docker logs {CONTAINER} --tail 5", sudo=use_sudo, password=pw)
    ssh.close()
    print(f"Done: http://{host}:3000")
