import paramiko

for cfg in [
    {"host": "10.100.14.69", "user": "aan", "password": "Sementara3", "sudo": True},
    {"host": "10.100.14.129", "user": "affa", "password": "Admin@2025", "sudo": False},
]:
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cfg['host'], port=22, username=cfg['user'], password=cfg['password'], timeout=10)
        prefix = f'echo "{cfg["password"]}" | sudo -S ' if cfg['sudo'] else ''
        _, out, err = ssh.exec_command(f"{prefix}docker logs report2-app --tail 50 2>&1", timeout=15)
        logs = out.read().decode('utf-8', errors='replace')
        print(f"\n=== Logs from {cfg['host']} ===")
        # Filter for errors/export related
        for line in logs.splitlines():
            if any(k in line.lower() for k in ['error', 'export', 'gcs', 'history', 'failed', 'warn', 'unauthorized']):
                print(line.encode('ascii', errors='replace').decode('ascii'))
        ssh.close()
    except Exception as e:
        print(f"{cfg['host']}: {e}")
