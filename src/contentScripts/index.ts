import { onMessage } from "webext-bridge/content-script";
import { createApp } from "vue";
import App from "./views/App.vue";
import { init } from "./element-plus";
import { setupApp } from "~/logic/common-setup";
// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info("[vitesse-webext] Hello world from content script");

  // communication example: send previous tab title from background page
  onMessage("tab-prev", ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`);
  });
  // mount component to context window
  const container = document.createElement("div");
  container.id = __NAME__;
  container.style.position = "fixed";
  container.style.zIndex = "999999";

  const root = document.createElement("div");
  const styleEl = document.createElement("link");
  const shadowDOM =
    container.attachShadow?.({ mode: __DEV__ ? "open" : "closed" }) ||
    container;

  styleEl.setAttribute("rel", "stylesheet");
  styleEl.setAttribute(
    "href",
    browser.runtime.getURL("dist/contentScripts/style.css")
  );

  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);
  init(shadowDOM);
  document.body.appendChild(container);

  const app = createApp(App);

  // 注册组件
  // 方式1：全局注册单个组件

  // 方式2：全局注册所有组件
  // app.use(Antd);

  // 应用其他设置
  setupApp(app);

  // 挂载应用
  app.mount(root);

  // 添加清理函数，确保在扩展卸载时正确销毁组件
  return () => {
    app.unmount();
    container.remove();
  };
})();
