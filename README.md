# 录制
在window环境执行
```
npx playwright codegen --channel chrome --user-data-dir="C:/temp/chrome-debug"
```

# 需要登录，提前打开调试浏览器
- 在wsl
```
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

- 在window
```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir=C:/temp/chrome-debug
```
```
