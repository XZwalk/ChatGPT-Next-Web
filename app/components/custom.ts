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
let nowServerDataStr: any = null;
let timeInterval: number = 2;


function beigin() {
  zxlog(`程序注入成功`);

  loginMyServer(() => {
    zxlog(`启动自动同步程序，每${timeInterval}分钟同步一次`);
    autoSyncData();
  });
}


function syncDataToServer() {
  zxlog(`${new Date()} 准备同步数据`);
  const nowDataStr = localStorage.getItem('chat-next-web-store');
  if (nowServerDataStr === nowDataStr) {
    zxlog(`服务器数据与本地数据一致，不上传数据，${timeInterval}分钟后继续检查`);
    return;
  }

  syncData(getLocalStoreData(), () => {
    nowServerDataStr = nowDataStr;
    zxlog(`********************本次同步完成********************\n\n`);
  });
}

function autoSyncData() {
  syncDataToServer();
  window.setInterval(() => {
    syncDataToServer();
  }, timeInterval * 60 * 1000);
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

    try {
      const access_control = JSON.parse(localStorage.getItem('access-control') || '{}');
      // 授权码
      access_control.state.accessCode = deviceInfo.accessCode || '';
      // openai的key
      access_control.state.token = deviceInfo.apiKey || '';
      localStorage.setItem('access-control', JSON.stringify(access_control));
      zxlog(`登录成功，写入 access-control`);
    } catch (error) {
      console.log(error);
    }

    if (!deviceInfo.isChangeDevice) {
      zxlog(`本次登录，设备信息未改变，不覆盖本机数据`);
      completeBlock(true);
      return;
    }

    getAllChatData((allData) => {
      if (allData && allData.state) {
        localStorage.setItem('chat-next-web-store', JSON.stringify(allData));
        zxlog(`写入数据到 chat-next-web-store`);
        // if (typeof alert !== 'undefined') {
        //   alert("检测到更换设备登录，需要把服务器数据覆盖到本地，如果不想覆盖本地数据，不要点击确定按钮，请立即关闭该页面，否则数据会自动覆盖！！！");
        // }

        // window.setTimeout(() => {
        //   location.reload();
        // }, 1000);
        return;
      }

      zxlog(`获取全量数据异常，有可能为首次登录，服务器无数据，不覆盖本机数据`);
      completeBlock(true);
    });
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


/************************ 登录操作 ************************/
function getCookie() {
  let cookieStr = null;
  if (typeof localStorage !== 'undefined') {
    cookieStr = localStorage.getItem('myCookie');
  }
  if (cookieStr) {
    return JSON.parse(cookieStr);
  }
  return {
    userName: '',
    token: ''
  };
  // return {
  //   userName: 'zhangxiang',
  //   token: '12345633'
  // };
}

function showLoginPop() {
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
          <label for="input_token" style="display: block; margin-bottom: 5px;">Token</label>
          <input id="input_token" type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
        </div>
        <button id="button_login" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: #fff; border: none; border-radius: 5px; cursor: pointer;">登录</button>
      </div>
    </div>
    `;
    document.body.appendChild(popDom);
  }

  document.getElementById('button_login')!.onclick = function () {
    const userNameInput = document.getElementById('input_userName') as HTMLInputElement;
    const tokenInput = document.getElementById('input_token') as HTMLInputElement;
    const userName = userNameInput.value;
    const token = tokenInput.value;
    if (!userName || !token) {
      window.alert(`输入内容不能为空`);
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
  const indexUrl = `${getApiDomain()}/ChatGPT/login?userName=${loginInfo.userName}&token=${loginInfo.token}&deviceToken=${getDeviceToken()}`;
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


// 从云端获取候选人数据，云端不存在则创建一条数据
function getAllChatData(completeBlock: (arg0: any) => void) {
  const loginInfo = getCookie();
  const indexUrl = `${getApiDomain()}/ChatGPT/allData?userName=${loginInfo.userName}&token=${loginInfo.token}`;
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
      userName: loginInfo.userName,
      token: loginInfo.token,
      store: store,
      deviceToken: getDeviceToken(),
    })
  }).then(res => res.json()).then(result => {
    if (result.code === 9100) {
      // 设备发生变更
      zxlog(`/ChatGPT/sync：${result.msg}`);
      alert(`检测到在其他设备登录，点击确认按钮，立马刷新页面，在当前设备登录`);
      location.reload();
      return;
    }

    if (result.code !== 200) {
      zxlog(`/ChatGPT/sync：${result.msg}`);
      return;
    }
    zxlog(`数据上传到服务器成功`);
    console.log(result);
    completeBlock(result.data);
  });
}


/************************ public ************************/
function zxlog(logStr: string) {
  console.log(`%c${logStr}`, "color: blue; font-weight: bold;");
}
