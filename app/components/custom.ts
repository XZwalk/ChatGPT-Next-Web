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
export {};

function beigin() {
  zxlog(`开始注入`);

  zxlog(`注入 done`);
}

beigin();

/******************************************** public ********************************************/
function zxlog(logStr: string) {
  console.log(`%c${logStr}`, "color: blue; font-weight: bold;");
}
