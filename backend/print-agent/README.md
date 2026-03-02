# Windows Print Agent Setup

This allows your Ubuntu VPS to print to a thermal printer connected to a Windows PC via SSH.

## Architecture

```
[Ubuntu VPS] --SSH--> [Windows PC] --USB--> [Thermal Printer]
```

## Setup Steps

### 1. On Windows PC

#### Install OpenSSH Server
```powershell
# Run PowerShell as Administrator
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'
```

#### Copy print script
```powershell
# Create directory
mkdir C:\print-agent

# Copy print-receipt.ps1 to C:\print-agent\print-receipt.ps1
# (from this repo: backend/print-agent/print-receipt.ps1)
```

#### Configure Windows Firewall (if needed)
```powershell
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

#### Test locally
```powershell
# Test the print script
$testData = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("Test print"))
powershell -ExecutionPolicy Bypass -File C:\print-agent\print-receipt.ps1 -base64 $testData
```

### 2. On Ubuntu VPS

#### Generate SSH key (if you don't have one)
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/print_agent_key -N ""
```

#### Copy public key to Windows
```bash
# Display the public key
cat ~/.ssh/print_agent_key.pub

# On Windows, add this to:
# C:\Users\<YourUser>\.ssh\authorized_keys
```

#### Test SSH connection
```bash
ssh -i ~/.ssh/print_agent_key Administrator@<WINDOWS_IP> "echo Hello"
```

#### Set environment variables
Add to your `.env` or export before starting the backend:

```bash
# Required
export PRINT_SSH_HOST=192.168.1.100    # Windows PC IP or hostname
export PRINT_SSH_USER=Administrator     # Windows username

# Optional
export PRINT_SSH_KEY=/root/.ssh/print_agent_key   # Path to private key
export PRINT_SSH_SCRIPT='C:\print-agent\print-receipt.ps1'  # Script path on Windows
```

For PM2, add to ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'kiosk-api',
    script: 'app.js',
    env: {
      PRINT_SSH_HOST: '192.168.1.100',
      PRINT_SSH_USER: 'Administrator',
      PRINT_SSH_KEY: '/root/.ssh/print_agent_key'
    }
  }]
};
```

### 3. Network Configuration

The Windows PC must be reachable from the VPS. Options:

#### Option A: Cloudflare Tunnel (Recommended)
```powershell
# On Windows, install cloudflared and create tunnel for SSH
cloudflared tunnel create print-agent
cloudflared tunnel route dns print-agent print.yourdomain.com
# Configure tunnel to forward to localhost:22
```

Then on VPS use `PRINT_SSH_HOST=print.yourdomain.com`

#### Option B: Tailscale VPN
1. Install Tailscale on both Windows and VPS
2. Use Tailscale IP for PRINT_SSH_HOST

#### Option C: Port Forwarding
1. Forward port 22 (or custom) on your router to Windows PC
2. Use public IP or DDNS for PRINT_SSH_HOST

## Troubleshooting

### Test from VPS
```bash
# Test SSH connection
ssh -v -i ~/.ssh/print_agent_key Administrator@<WINDOWS_IP> "powershell Get-Printer"

# Test print script
ssh -i ~/.ssh/print_agent_key Administrator@<WINDOWS_IP> \
  "powershell -ExecutionPolicy Bypass -File C:\print-agent\print-receipt.ps1 -base64 'VGVzdA=='"
```

### Common Issues

1. **Connection refused**: Check Windows firewall and OpenSSH service
2. **Permission denied**: Verify SSH key is in authorized_keys
3. **Printer not found**: Ensure printer is installed and visible in Windows
4. **Script not found**: Check PRINT_SSH_SCRIPT path uses double backslashes

## Security Notes

- Use SSH key authentication (not passwords)
- Consider restricting the SSH user's permissions
- Use a tunnel (Cloudflare/Tailscale) instead of exposing SSH to internet
- The print script only accepts base64 data, limiting attack surface
