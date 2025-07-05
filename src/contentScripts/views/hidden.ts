// @ts-nocheck
import { isGray } from "~/logic/storage";

function hideKl8() {
  // 获取id为currentData的元素
  const currentDataElement = document.getElementById("currentData");

  // 检查元素是否存在
  if (currentDataElement) {
    // 获取所有子元素
    const children = currentDataElement.children;

    // 确保有至少两个子元素
    if (children.length >= 2) {
      // 删除前两个子元素
      // 注意：每次删除后，children集合会自动更新，所以总是删除索引0的元素
      currentDataElement.removeChild(children[0]);
      currentDataElement.removeChild(children[0]);

      console.log("成功删除前两个子元素");
    } else {
      console.log("子元素数量不足，无法删除前两个");
    }
  } else {
    console.log("未找到id为currentData的元素");
  }
}
// 通用元素隐藏函数（带安全校验）
function hideElementsByClassName(className, count) {
  const elements = document.getElementsByClassName(className);
  if (!elements.length) return; // 无元素时提前返回

  const maxCount =
    count !== undefined ? Math.min(count, elements.length) : elements.length;
  for (let i = 0; i < maxCount; i++) {
    if (elements[i]) elements[i].style.display = "none"; // 校验元素存在性
  }
}

// 核心清理函数（所有 DOM 操作带安全校验）
function clear() {
  // 隐藏元素列表
  const hideList = [
    { className: "xp-info" },
    { className: "zst-number" },
    { className: "presqu", count: 2 },
    { className: "btn-pc" },
    { className: "btn-download" },
    { className: "header" },
    { className: "btn-szc" },
  ];

  hideList.forEach((item) => {
    hideElementsByClassName(item.className, item.count);
  });

  // 调整占位元素高度
  const fixedBottomPlaceholder = document.getElementsByClassName(
    "fixed-bottom-placeholder"
  )[0];
  if (fixedBottomPlaceholder) {
    fixedBottomPlaceholder.style.height = "44px";
  }

  // 隐藏特定表格体
  function removeTableBodyWithThbg() {
    // 选择所有直接位于 tbody 下的 .thbg 元素
    const thbgElements = document.querySelectorAll("tbody > .thbg");

    thbgElements.forEach((element) => {
      const tbody = element.closest("tbody"); // 找到当前 .thbg 元素的最近 tbody 父元素
      if (tbody) {
        tbody.remove(); // 删除 tbody
      }
    });
  }
  removeTableBodyWithThbg();

  // 操作父元素子节点（带存在性校验）
  const parent = document.getElementById("now_gross");
  if (parent) {
    // 先删除第4项（索引3）
    if (parent.children[3]) parent.removeChild(parent.children[3]);
    // 再删除第2项（索引1）
    if (parent.children[1]) parent.removeChild(parent.children[1]);
  }

  // 调整元素宽度
  const zstElement = document.getElementById("zst");
  if (zstElement) {
    zstElement.style.width = "auto";
  }

  // 调整类型列表样式
  const typeList = document.getElementsByClassName("type-list")[0];
  if (typeList) {
    typeList.style.cssText = "height: 44px; width: 100%;";
  }
}

function setNone(id) {
  if (document.getElementById(id)) {
    document.getElementById(id).style.display = "none";
  }
}

export function init() {
  try {
    const currentUrl = window.location.hostname; // 获取当前页面域名
    // 创建数字选择器（使用默认配置）

    // 仅在目标域名且存储域名匹配时执行
    if (currentUrl.includes("lotto.sina.cn")) {
      document.documentElement.style.userSelect = "none";
      // 应用灰度样式
      document.body.style.maxWidth = "unset";
      if (document.getElementById("chartsTable")) {
        document.getElementById("chartsTable").style.width = "100%";
      }
      if (document.getElementsByClassName("zst_table")?.[1]) {
        document.getElementsByClassName("zst_table")[1].style.width = "100%";
      }
      setNone("wrapper");
      clear();
      hideKl8();
    }
  } catch (error) {
    console.error("初始化失败:", error);
  }
}

export function changeGray() {
  const currentUrl = window.location.hostname;
  if (currentUrl.includes("lotto.sina.cn") && document.getElementById("zst")) {
    document.getElementById("zst").style.filter =
      isGray.value === "2" ? "grayscale(100%)" : "";
  }
}
