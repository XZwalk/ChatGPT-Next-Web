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

function beigin() {


  zxlog(`开始 获取云端数据`);
  fetchIDsData((ids) => {
    const sessions = getSessionsWithIds(ids);
    syncData(ids, sessions, (dataAry) => {
      zxlog(`syncData done`);
    });
  });
}


function getSessionsWithIds(ids:any) {
  const localDataStr = localStorage.getItem('chat-next-web-store');
  try {
    const jsonData = JSON.parse(localDataStr || '{}');
    if (jsonData && jsonData.state && jsonData.state.sessions) {
      const resultAry = [];
      const sessions = jsonData.state.sessions;
      for (let index = 0; index < sessions.length; index++) {
        const element = sessions[index];
        const idInfo = ids[element.id] || {};
        if (idInfo.lastUpdate !== element.lastUpdate) {
          resultAry.push(element);
        }

        idInfo.lastUpdate = element.lastUpdate;
        ids[element.id] = idInfo;
      }

      return resultAry;
    }
  } catch (error) {
    return [];
  }

  return [];
}




beigin();


/************************ 登录操作 ************************/
function getCookie() {
  return {
    userName: 'zhangxiang',
    token: '123456'
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

// 从云端获取候选人数据，云端不存在则创建一条数据
function fetchIDsData(completeBlock: (arg0: any) => void) {
  console.log(`fetchIDsData`);
  const loginInfo = getCookie();
  const indexUrl = `${getApiDomain()}/ChatGPT/ids?userName=${loginInfo.userName}&token=${loginInfo.token}`;
  fetch(indexUrl, { method: 'GET' }).then(res => res.json()).then(function (result) {
    if (result.code !== 200) {
      console.log(result.msg);
      return;
    }
    console.log(result);
    completeBlock(result.data);
  });
};


function syncData(ids: any, sessions: any, completeBlock: (arg0: any) => void) {
  const loginInfo = getCookie();
  fetch(`${getApiDomain()}/ChatGPT/sync`, {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      userName: loginInfo.userName,
      token: loginInfo.token,
      ids: ids,
      sessions: sessions
    })
  }).then(res => res.json()).then(result => {
    if (result.code !== 200) {
      console.log(result.msg);
      return;
    }
    console.log(`数据创建成功`);
    console.log(result);
    completeBlock(result.data);
  });
}


/************************ public ************************/
function zxlog(logStr: string) {
  console.log(`%c${logStr}`, "color: blue; font-weight: bold;");
}
