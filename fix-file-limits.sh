#!/bin/bash

echo "正在修复 macOS 文件描述符限制..."

# 创建 launchd 配置文件
sudo tee /Library/LaunchDaemons/limit.maxfiles.plist > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>200000</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
EOF

# 设置权限
sudo chown root:wheel /Library/LaunchDaemons/limit.maxfiles.plist
sudo chmod 644 /Library/LaunchDaemons/limit.maxfiles.plist

# 立即应用设置
sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist
sudo launchctl limit maxfiles 65536 200000

# 为当前会话设置
ulimit -n 65536

echo "文件描述符限制已设置完成！"
echo "当前限制: $(ulimit -n)"
echo "系统限制: $(launchctl limit maxfiles)"