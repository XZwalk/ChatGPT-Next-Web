/***********************************************************************************************************************************
 *   发布网站：https://vercel.com/xzwalk/chat-gpt-xiang-zi/deployments
 *
 *
 *   开发环境安装及运行：
 *   npm i yarn
 *   debug：执行 yarn install && yarn dev 即可。⚠️ 注意：此命令仅用于本地开发，不要用于部署！
 *   ./node_modules/.bin/yarn install && ./node_modules/.bin/yarn dev
 *
 *
 *   远程访问调试页面：假如远程开发地址为：https://zxwalk.coding.net/vscode-web/coding-ci-c7k-1h4hpjai9-001。开发者在远程开发容器中，启动了一个端口为 3000 的 web 服务，访问此 web 服务的地址的方式为：https://xx.com/vscode-web/coding-ci-xxx/proxy/3000/。即在 url 路径后加上端口 /proxy/3000/ 即可。
 *   https://zxwalk.coding.net/coding-ci-aeg-1h4hq53qa-001/proxy/3000/
 *
 *
 *
 ************************************************************************************************************************************/

// 解决报错：Type error: 'custom.ts' cannot be compiled under '--isolatedModules' because it is considered a global script file. Add an import, export, or an empty 'export {}' statement to make it a module.
export { };

// 定义常量
// 当前服务器上的数据
let nowServerDataStr: any = null;
// 轮询检查的时间间隔
let timeInterval: number = 2;
// 自动同步数据的定时器对象
let autoSyncTimeRepeat: any = null;
// 是否展示设备更换的提示弹窗
let alertChangeDeviceShown: boolean = false;

function beigin() {
  zxlog(`程序注入成功`);

  loginMyServer(() => {
    zxlog(`启动自动同步程序，每${timeInterval}分钟同步一次`);
    // 开启自动同步
    autoSyncData();
    // 先同步一次数据，将本地数据上传到云端
    syncDataToServer();
    // 监控页面活跃状态
    monitorPageVisible();
    // 展示登录信息
    addCurrentLoginInfo();
    // 调整界面布局
    adjustPageUI();
    // 更新消耗tokens数据
    startUpdateTokensUsed();
  });
}


function syncDataToServer() {
  zxlog(`\n\n\n****************${new Date()} 准备同步数据****************`);
  const nowDataStr = localStorage.getItem('chat-next-web-store');
  if (nowServerDataStr === nowDataStr) {
    zxlog(`服务器数据与本地数据一致，不上传数据，${timeInterval}分钟后继续检查`);
    checkServerCurrentDeviceToken((isSuccess) => {
      if (!isSuccess) {
        // 设备已更换，停止数据同步，并提示
        stopSyncData();
      }
      zxlog(`********************本次同步完成********************\n\n\n`);
    });
    return;
  }

  syncData(getLocalStoreData(), () => {
    nowServerDataStr = nowDataStr;
    zxlog(`********************本次同步完成********************\n\n\n`);
  });
}

function autoSyncData() {
  zxlog(`\n\n\n-----------开启自动同步逻辑，每${timeInterval}分钟上传一次数据-----------\n\n\n`);
  // 先停止再开启，防止重复
  window.clearInterval(autoSyncTimeRepeat);

  autoSyncTimeRepeat = window.setInterval(() => {
    syncDataToServer();
  }, timeInterval * 60 * 1000);

  // 开启余额数据请求
  startUpdateTokensUsed();
}

function stopSyncData() {
  if (alertChangeDeviceShown) {
    zxlog(`当前已展示停止更新数据弹窗，此次不展示`);
    return;
  }
  zxlog(`!!!数据同步已停止!!!`);
  window.clearInterval(autoSyncTimeRepeat);
  autoSyncTimeRepeat = null;
  alertChangeDeviceShown = true;
  showAlert(`登录下线提醒`, `检测到在其他设备登录，本设备已离线，点击按钮，立马在当前设备登录，否则请关闭当前页面！`, '登录当前设备', false, () => {
    alertChangeDeviceShown = false;
    location.reload();
  });

  // 停止余额数据请求
  stopUpdateTokensUsed();
}


function requestAllDataOnline(completeBlock: (arg0: any) => void) {
  getAllChatData((allData) => {
    if (allData && allData.state) {
      showAlert('数据同步提醒', `已在当前设备登录成功，其他设备已下线，点击按钮，远端数据将覆盖本地数据。`, '覆盖本地数据', false, () => {
        loadingWithDesc('检测到更换设备登录，需要把服务器数据覆盖到本地，正在执行数据覆盖操作，请勿刷新页面或者进行其他操作', 10, () => {
          // 这里不能直接写入，页面节点加载较慢，可能数据写入成功以后又被覆盖掉了，所以得等页面加载完成以后再写入数据，防止数据被覆盖掉
          localStorage.setItem('chat-next-web-store', JSON.stringify(allData));
          zxlog(`写入数据到 chat-next-web-store`);
          setTimeout(() => {
            showLoading('数据替换完成，准备刷新页面，请稍候......');
            location.reload();
          }, 1000);
        });
      });
      return;
    }

    zxlog(`获取全量数据异常，有可能为首次登录，服务器无数据，不覆盖本机数据`);
    completeBlock(true);
  });
}


function loginMyServer(completeBlock: (arg0: any) => void) {
  zxlog(`登录服务器......`);
  deviceLogin((deviceInfo) => {
    if (!deviceInfo) {
      // 获取信息失败，登录失败，404
      zxlog(`登录失败，弹出登录窗口，准备登录`);
      showLoginPop();
      return;
    }

    const access_control = JSON.parse(localStorage.getItem('access-control') || '{}');
    // 是否是第一次登录
    let isFirstLogin = false;
    // 授权是否发生改变
    let isAccessChange = false;
    if (!access_control.state.accessCode && !access_control.state.token) {
      // 首次登录，需要刷新页面
      isFirstLogin = true;
    }
    // 授权码(根据官方指导，发布网站的时候设置的访问密码，不设置也是可以的)
    isAccessChange = deviceInfo.accessCode !== access_control.state.accessCode;
    access_control.state.accessCode = deviceInfo.accessCode;
    // openai的key
    isAccessChange = deviceInfo.apiKey !== access_control.state.token;
    access_control.state.token = deviceInfo.apiKey;
    // openai的代理url
    isAccessChange = deviceInfo.apiUrl !== access_control.state.openaiUrl;
    access_control.state.openaiUrl = deviceInfo.apiUrl;

    if (isFirstLogin || isAccessChange) {
      const tipHeadStr = isFirstLogin ? `检测到首次登录设备` : `检测到授权码发生变化`;
      loadingWithDesc(`${tipHeadStr}，正在下发服务器token和openai keys，需要刷新页面，请稍候`, 5, () => {
        localStorage.setItem('access-control', JSON.stringify(access_control));
        hideLoading();
        // 首次登录，相当于更换设备，需要使用远端数据覆盖
        if (isFirstLogin) {
          requestAllDataOnline(completeBlock);
          return;
        }

        // 以下逻辑为授权码发生变化的处理逻辑
        // 授权码变化，设备未发生变化，只刷新页面即可
        if (!deviceInfo.isChangeDevice) {
          zxlog(`本次登录，设备信息未改变，不覆盖本机数据`);
          location.reload();
          return;
        }

        // 授权码变化，设备也发生变化，则需要远程覆盖本地数据
        requestAllDataOnline(completeBlock);
      });
      return;
    }

    if (!deviceInfo.isChangeDevice) {
      zxlog(`本次登录，设备信息未改变，不覆盖本机数据`);
      completeBlock(true);
      return;
    }

    requestAllDataOnline(completeBlock);
  });
}

function getLocalStoreData() {
  const localDataStr = localStorage.getItem('chat-next-web-store');
  try {
    const jsonData = JSON.parse(localDataStr || '{}');
    return jsonData;
  } catch (error) {
    return null;
  }
}

function getDeviceToken() {
  let deviceToken = null;
  if (typeof localStorage !== 'undefined') {
    deviceToken = localStorage.getItem('deviceToken');
  }
  if (!deviceToken) {
    deviceToken = `${new Date().getTime()}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('deviceToken', deviceToken);
    }
  }
  return deviceToken;
}


beigin();


/************************ loading ************************/
function showLoading(descStr: any) {
  if (!document.getElementById('div_pop')) {
    const popDom = document.createElement('div');
    popDom.innerHTML = `
    <div id="div_pop" style="position: fixed; z-index: 10000; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4);">
      <div id="content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 500px;padding: 20px; border-radius: 10px; text-align: center;color: #3c763d;background-color: #dff0d8;border-color: #d6e9c6;">
        ${descStr || '数据替换中......'}
      </div>
    </div>
    `;
    document.body.appendChild(popDom);
    return;
  }
  document.getElementById('content')!.innerHTML = descStr;
}


function loadingWithDesc(descStr: string, time: number, completeBlock: () => void) {
  let index = time;
  const timeRepeat = window.setInterval(() => {
    if (index <= 0) {
      window.clearInterval(timeRepeat);
      completeBlock();
      return;
    }

    showLoading(`${descStr} <span style="color:red;font-weight:bold;">${index}</span>s ......`);
    index--;
  }, 1000);
}


function hideLoading() {
  const popDom = document.getElementById('div_pop');
  if (popDom) {
    popDom.parentNode!.removeChild(popDom);
  }
}

/************************ 登录操作 ************************/
function getCookie() {
  const tokenStr = getCookiWithKey('token');
  const emailStr = getCookiWithKey('email');

  return {
    email: emailStr || '',
    token: tokenStr || ''
  };
  // return {
  //   email: 'zhangxiang',
  //   token: '12345633'
  // };
}

function addAccountDom() {
  loadMultipleCSS([
    'https://personal.xiangzi.site/Public/Front/tools/nav/nav.css',
    'https://personal.xiangzi.site/Public/Front/tools/account/account.css'
  ]);

  // '../../../../../Public/Front/js/urlHandle.js'
  loadMultipleJS(['https://personal.xiangzi.site/Public/Front/js/urlHandle.js'], () => {
    loadMultipleJS([
      'https://personal.xiangzi.site/Public/Front/tools/account/account.js',
      'https://personal.xiangzi.site/Public/Front/tools/nav/nav.js',
      'https://personal.xiangzi.site/Public/Front/js/request.js',
    ], () => {
      try {
        if (!isLogin()) {
          const div_account_manager = document.createElement('div');
          div_account_manager.id = 'div_account_manager';
          div_account_manager.style.display = 'none';
          document.body.appendChild(div_account_manager);
          initWithDomID('div_account_manager');
          openAccountPopup();
          // 登录弹窗展示的相关配置
          // accountConfig.backImageUrl = require('./resources/jike.png');
          // accountConfig.backgroundColor = 'rgb(255 241 204)';
          // accountConfig.copyRight = '';
          const closeDom = document.querySelector('.popup-content .close') as HTMLSpanElement;
          if (closeDom) {
            closeDom.style.display = 'none';
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
}


function showLoginPop() {
  addAccountDom();
  return;

  if (!document.getElementById('div_pop')) {
    const popDom = document.createElement('div');
    popDom.innerHTML = `
    <div id="div_pop" style="position: fixed; z-index: 10000; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4);">
      <div id="content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 500px; background-color: #fff; padding: 20px; border-radius: 10px; text-align: center;">
        <h3 style="margin-bottom: 20px;margin-top: 0;">登录账号</h3>
        <div style="margin-bottom: 10px;">
          <label for="input_userName" style="display: block; margin-bottom: 5px;">用户名</label>
          <input id="input_userName" type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <div style="margin-bottom: 10px;">
          <label for="input_pwd" style="display: block; margin-bottom: 5px;">密码</label>
          <input id="input_pwd" type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <button id="button_login" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: #fff; border: none; border-radius: 5px; cursor: pointer;">登录</button>
      </div>
    </div>
    `;
    document.body.appendChild(popDom);
  }

  document.getElementById('button_login')!.onclick = function () {
    const userNameInput = document.getElementById('input_userName') as HTMLInputElement;
    const tokenInput = document.getElementById('input_pwd') as HTMLInputElement;
    const userName = userNameInput.value;
    const token = tokenInput.value;
    if (!userName || !token) {
      showAlert('登录', `输入内容不能为空`, null, false, null);
      return;
    }

    localStorage.setItem('myCookie', JSON.stringify({
      userName: userName,
      token: token
    }));

    location.reload();
  };
}


/************************ 数据同步 ************************/
function getApiDomain() {
  const isTest = false;
  if (!isTest) {
    return `https://api.xiangzi.site:9007`;
  }
  return `http://localhost:9007`;
}


function deviceLogin(completeBlock: (arg0: any) => void) {
  const loginInfo = getCookie();
  const indexUrl = `${getApiDomain()}/ChatGPT/login?email=${loginInfo.email}&token=${loginInfo.token}&deviceToken=${getDeviceToken()}`;
  fetch(indexUrl, { method: 'GET' }).then(res => res.json()).then(function (result) {
    if (result.code !== 200) {
      zxlog(`/ChatGPT/login：${result.msg}`);
      completeBlock(null);
      return;
    }
    console.log(result);
    completeBlock(result.data);
  });
};


function checkServerCurrentDeviceToken(completeBlock: (arg0: boolean | null) => void) {
  const loginInfo = getCookie();
  const indexUrl = `${getApiDomain()}/ChatGPT/deviceToken?email=${loginInfo.email}&token=${loginInfo.token}`;
  fetch(indexUrl, { method: 'GET' }).then(res => res.json()).then(function (result) {
    console.log(result);
    const localDeviceToken = getDeviceToken();
    if (result.code === 200 && result.data === localDeviceToken) {
      zxlog(`检测服务器deviceToken：与本地一致，当前登录状态正常。`);
      completeBlock(true);
      return;
    }

    zxlog(`检测服务器deviceToken：已更换设备登录，停止数据同步`);
    completeBlock(false);
  });
}

// 从云端获取候选人数据，云端不存在则创建一条数据
function getAllChatData(completeBlock: (arg0: any) => void) {
  const loginInfo = getCookie();
  const indexUrl = `${getApiDomain()}/ChatGPT/allData?email=${loginInfo.email}&token=${loginInfo.token}`;
  fetch(indexUrl, { method: 'GET' }).then(res => res.json()).then(function (result) {
    if (result.code !== 200) {
      zxlog(`/ChatGPT/allData：${result.msg}`);
      return;
    }
    console.log(result);
    completeBlock(result.data);
  });
};


function syncData(store: any, completeBlock: (arg0: any) => void) {
  if (!store || JSON.stringify(store).length <= 4) {
    zxlog(`本次读取的store数据异常，数据不上传，请检查！`);
    return;
  }
  const loginInfo = getCookie();
  fetch(`${getApiDomain()}/ChatGPT/sync`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      email: loginInfo.email,
      token: loginInfo.token,
      store: store,
      deviceToken: getDeviceToken(),
    })
  }).then(res => res.json()).then(result => {
    if (result.code === 9100) {
      // 设备发生变更
      zxlog(`/ChatGPT/sync：${result.msg}`);
      stopSyncData();
      return;
    }

    if (result.code !== 200) {
      zxlog(`/ChatGPT/sync：${result.msg}`);
      return;
    }
    zxlog(`数据上传到服务器成功`);
    console.log(store);
    console.log(result);
    completeBlock(result.data);
  });
}

/************************ 前后台 ************************/
function monitorPageVisible() {
  setTimeout(() => {
    zxlog(`开启网页活跃状态监控`);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        // 页面进入后台时的操作
        monitorlog("页面进入后台，先同步一次数据，之后停止数据同步....");
        window.clearInterval(autoSyncTimeRepeat);
        autoSyncTimeRepeat = null;
        syncDataToServer();
        // 余额信息暂停
        stopUpdateTokensUsed();
      } else {
        // 页面从后台返回时的操作
        monitorlog("页面从后台返回，先检查设备登录状态，之后开启自动同步数据");
        if (autoSyncTimeRepeat) {
          monitorlog("检测到autoSyncTimeRepeat对象已存在，不执行开启逻辑");
        } else {
          // 从后台回来先检查设备是否更换，再进行操作，确保用户切到前台的时候进行提问，但是设备已更换，导致数据丢失
          checkServerCurrentDeviceToken((isSuccess) => {
            if (isSuccess) {
              // 未更换设备，开启自动同步
              autoSyncData();
            } else {
              // 设备已更换，停止数据同步
              stopSyncData();
            }
          });
        }
      }
    });
  }, 5000);
}


/************************ 界面展示调整 ************************/
function adjustPageUI() {
  // 修改文案：ChatGPT Next
  const titleDom = document.querySelector('.home_sidebar-title__l3KhW');
  if (titleDom) {
    titleDom.innerHTML = `ChatGPT`;
  }

  // 去掉文案描述：Build your own AI assistant.
  const descDom = document.querySelector('.home_sidebar-sub-title__sbT6Z');
  if (descDom) {
    descDom.parentNode!.removeChild(descDom);
  }

  // 移除github按钮
  const githubA = document.querySelector('#github_svg__a');
  if (githubA) {
    const githubBtn = githubA.parentNode!.parentNode!.parentNode!.parentNode;
    githubBtn!.parentNode!.removeChild(githubBtn!);
  }

  // 修改网页标题
  document.title = 'ChatGPT';
}

/************************ tokens使用数据 ************************/
function updateTokensUsed() {
  function requestData(url: string, completeBlock: any) {
    const access_control = JSON.parse(localStorage.getItem('access-control') || '{}');
    const statusData = access_control.state || {};
    const token = statusData.token || '';

    if (!token) {
      completeBlock({});
      return;
    }

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);
    fetch(url, {
      method: 'GET', // 根据需要设置请求方法
      headers: headers
    }).then(res => res.json()).then(response => {
      // 处理响应
      console.log(response);
      completeBlock(response);
    }).catch(error => {
      // 处理错误
      console.log(error);
    });
  }

  // 订阅url
  const subscriptionUrl = 'https://api.nextweb.fun/openai/dashboard/billing/subscription';
  // 使用数据url
  const useUrl = 'https://api.nextweb.fun/openai/dashboard/billing/usage';
  requestData(subscriptionUrl, (subscriptionData: any) => {
    requestData(useUrl, (useData: any) => {
      const total_usage = (useData.total_usage || 0) / 100;
      const system_hard_limit = (subscriptionData.system_hard_limit || 0);
      console.log(`总共${system_hard_limit},已使用${total_usage}`);
      updateUseDom(total_usage, system_hard_limit);
    });
  });
}

function updateUseDom(use: any, total: any) {
  const div_used_info = document.getElementById('div_used_info');
  if (!div_used_info) {
    return;
  }
  div_used_info.innerHTML = `总量:${(total / 10000).toFixed(2)}w,消耗:${(use / 10000).toFixed(2)}w`;
}

let autoUpdateTokensTimeRepeat: any = null;
function startUpdateTokensUsed() {
  // 先清除
  window.clearInterval(autoUpdateTokensTimeRepeat);
  autoUpdateTokensTimeRepeat = window.setInterval(() => {
    updateTokensUsed();
  }, 60 * 1000);

  updateTokensUsed();
}

function stopUpdateTokensUsed() {
  window.clearInterval(autoUpdateTokensTimeRepeat);
}
/************************ 登录信息展示 ************************/
function addCurrentLoginInfo() {
  const myCookie = localStorage.getItem('myCookie');
  if (!myCookie) {
    return;
  }

  if (document.getElementById('div_login_info')) {
    return;
  }

  const myCookieJsonData = JSON.parse(myCookie);
  const emailName = myCookieJsonData.email;
  // 创建要插入的新元素
  const loginDom = document.createElement('div');
  loginDom.id = 'div_login_info';
  loginDom.style.cssText = `
  display: flex;
  justify-content: space-between;
  `;
  loginDom.innerHTML = `
  <div>
    ${emailName}
    <div id="div_used_info" style="font-size: 12px;color: gray;margin-top: 5px;"></div>
  </div>
  <button id="button_logout" class="button_icon-button__VwAMf">退出登录</button>
  `;
  // home_sidebar-header___NHg_
  const headDom = document.querySelector('.home_sidebar-header___NHg_');
  // 在目标元素之前插入新元素
  headDom!.parentNode!.insertBefore(loginDom, headDom);

  document.getElementById('button_logout')!.onclick = function () {
    showAlert(`退出登录提醒`, `退出登录后本地数据会全部清除，确定退出吗？`, '退出登录', true, () => {
      stopSyncData();
      // 清除当前登录信息
      localStorage.removeItem('myCookie');
      localStorage.removeItem('access-control');
      localStorage.removeItem('chat-next-web-store');
      location.reload();
    });
  };

  zxlog(`注入登录信息展示dom`);
}


/************************ alert ************************/
function showAlert(title: any, desc: any, btnTitle: any, isNeedCancel: boolean, completeBlock: any) {
  let myAlert = document.getElementById('myModal');
  const cancelBtnStr = isNeedCancel ? `<button id="cancelButton" class="modal-button" style="background-color: green;">取消</button>` : '';
  if (!myAlert) {
    myAlert = document.createElement('div');
    myAlert.innerHTML = `
    <style>
    .modal-content {
      background-color: #fefefe;
      margin: 10% auto;
      padding: 20px;
      border: 1px solid #888;
      width: 80%;
      max-width: 400px;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      text-align: center;
    }

    .modal-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .modal-description {
      font-size: 18px;
      margin-bottom: 20px;
    }

    .modal-btn-content {
      justify-content: space-around;
      display: flex;
    }

    .modal-button {
      background-color: ${btnTitle ? '#fe5d4e' : '#4CAF50'};
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 3px;
      font-size: 16px;
      cursor: pointer;
    }
    </style>
    <div class="modal-content">
      <div class="modal-title">${title}</div>
      <div class="modal-description">${desc}</div>
      <div class="modal-btn-content">
        ${cancelBtnStr}
        <button id="modalButton" class="modal-button">${btnTitle || '确认'}</button>
      </div>
    </div>
    `;
    myAlert.id = 'myModal';
    myAlert.style.cssText = `
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10010;
    overflow: auto;
    `;
    document.body.appendChild(myAlert);
  }

  document.getElementById('modalButton')!.onclick = function () {
    // 将弹窗移出
    if (myAlert) {
      myAlert.parentNode!.removeChild(myAlert);
    }

    if (completeBlock) {
      completeBlock();
    }
  };

  if (isNeedCancel) {
    document.getElementById('cancelButton')!.onclick = function () {
      // 将弹窗移出
      if (myAlert) {
        myAlert.parentNode!.removeChild(myAlert);
      }
    };
  }

}
/************************ public ************************/
function zxlog(logStr: string) {
  console.log(`%c${logStr}`, "color: blue; font-weight: bold;");
}

function monitorlog(logStr: string) {
  console.log(`%c${logStr}`, "color: red; font-weight: bold;");
}

function loadMultipleCSS(cssUrls: Array<string>) {
  if (typeof document === "undefined") {
    return;
  }
  const head = document.head || document.getElementsByTagName('head')[0];

  for (var i = 0; i < cssUrls.length; i++) {
    const cssDom = document.createElement('link');
    cssDom.rel = 'stylesheet';
    cssDom.href = cssUrls[i];
    head.appendChild(cssDom);
  }
}


function loadMultipleJS(jsUrls: Array<string>, callback: any) {
  if (typeof document === "undefined") {
    return;
  }
  const head = document.head || document.getElementsByTagName('head')[0];

  let loadedCount = 0;

  function checkAllLoaded() {
    loadedCount++;
    if (loadedCount === jsUrls.length) {
      callback();
    }
  }

  for (var i = 0; i < jsUrls.length; i++) {
    var js = document.createElement('script');
    js.src = jsUrls[i];
    js.onload = checkAllLoaded;
    head.appendChild(js);
  }
}


function getCookiWithKey(name: string) {
  if (typeof document === "undefined") {
    return '';
  }
  var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  if (arr = document.cookie.match(reg))
    return decodeURI(arr[2]);
  else
    return '';
}
