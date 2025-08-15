(function(){
  // 仅在桌面端启用
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isDesktop = !isMobileUA && !hasTouch && (window.innerWidth >= 800);
  if (!isDesktop) return; // 在移动/触摸设备上不启用

  // 回退的 banAndRedirect：优先调用页面已有的 triggerDevtoolsProtect，否则本地写 banned list 并展示覆盖层或重定向
  function fallbackBan(reason) {
    try {
      const DEVICE_ID_KEY = 'xsy_device_id_v1';
      const BANNED_LIST_KEY = 'xsy_banned_devices_v1';
      function getDeviceId() {
        try {
          let id = localStorage.getItem(DEVICE_ID_KEY);
          if (id) return id;
          if (window.crypto && crypto.randomUUID) {
            id = crypto.randomUUID();
          } else if (window.crypto && crypto.getRandomValues) {
            const arr = new Uint8Array(16);
            crypto.getRandomValues(arr);
            id = Array.from(arr).map(b => ('0' + b.toString(16)).slice(-2)).join('');
          } else {
            id = 'xsy-' + Math.random().toString(36).slice(2, 10);
          }
          localStorage.setItem(DEVICE_ID_KEY, id);
          return id;
        } catch (e) { return 'xsy-ephemeral-' + Date.now(); }
      }
      const deviceId = getDeviceId();
      const raw = localStorage.getItem(BANNED_LIST_KEY);
      const list = raw ? (JSON.parse(raw) || []) : [];
      if (list.indexOf(deviceId) === -1) {
        list.push(deviceId);
        try { localStorage.setItem(BANNED_LIST_KEY, JSON.stringify(list)); } catch(e){}
      }

      // 简单覆盖层通知（用户体验友好）
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(255,255,255,0.98)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '20000';
      overlay.innerHTML = `<div style="max-width:720px;padding:24px;border-radius:8px;text-align:center;color:#333;">
        <h2 style="margin:0 0 12px;color:#c00;">已禁止访问</h2>
        <div style="margin-bottom:12px">检测到尝试通过浏览器保存/下载页面；设备已加入本地黑名单。</div>
        <div style="font-family:monospace;background:#fff;padding:8px;border-radius:4px;display:inline-block;margin-bottom:12px;">${deviceId}</div>
      </div>`;
      document.body.appendChild(overlay);

      const url = (window.f12RedirectUrl || '').toString().trim();
      if (url) {
        const target = url + (url.indexOf('?') === -1 ? '?' : '&') + 'banned=1&id=' + encodeURIComponent(deviceId) + '&reason=' + encodeURIComponent(reason || 'save-detect');
        setTimeout(()=>{ try{ location.replace(target); }catch(e){ location.href = target; } }, 700);
      }
    } catch (e) { try{ console.error(e); }catch(e){} }
  }

  function ban(reason){
    try {
      if (window.triggerDevtoolsProtect && typeof window.triggerDevtoolsProtect === 'function') {
        try { window.triggerDevtoolsProtect(); } catch(e){ fallbackBan(reason); }
      } else {
        fallbackBan(reason);
      }
    } catch (e) {
      try { fallbackBan(reason); } catch(e){}
    }
  }

  // 仅拦截保存/下载相关的快捷键（允许复制/打印/右键）
  window.addEventListener('keydown', function(e){
    try{
      const key = (e.key || '').toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      // 拦截 Ctrl/Cmd+S, Ctrl/Cmd+Shift+S (保存)
      if (ctrlOrCmd && (key === 's' || (e.shiftKey && key === 's'))) {
        try { e.preventDefault(); e.stopPropagation(); } catch(e){}
        ban('save-shortcut');
      }
      // 不拦截打印 Ctrl/Cmd+P，也不拦截复制快捷键
    }catch(e){}
  }, {capture:true, passive:false});

  // 拦截点击下载链接（带 download 属性 或 指向常见文件后缀）
  document.addEventListener('click', function(e){
    try {
      let el = e.target;
      while(el && el !== document.documentElement){
        if (el.tagName && el.tagName.toLowerCase() === 'a') {
          const downloadAttr = el.getAttribute('download');
          const href = el.getAttribute('href') || '';
          if (downloadAttr !== null || /\.(zip|rar|7z|pdf|exe|msi|dmg|tar|gz|png|jpg|jpeg|svg|webp|csv|xlsx|pptx|docx)(\?.*)?$/.test(href.toLowerCase())) {
            try { e.preventDefault(); e.stopPropagation(); } catch(e){}
            ban('link-download');
            return;
          }
        }
        el = el.parentNode;
      }
    } catch (e){}
  }, {capture:true, passive:false});

})();