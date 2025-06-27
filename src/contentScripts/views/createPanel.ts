export function createNumberSelector(options = {}) {
  // 默认配置（三行数字自然排列，左对齐）
  const defaultOptions = {
    row1: [1, 2, 3, null, null, 12, 13, 14, null, null, 23, 24, 25], // 第一行
    row2: [4, 5, 6, 10, 11, 15, 16, 17, 21, 22, 26, 27, 28], // 第二行
    row3: [7, 8, 9, 18, 19, 20, null, null, 29, 30, 31, 32, 33], // 第三行
    title: "数字选择器",
  };

  const config = { ...defaultOptions, ...options };

  // 检查是否已存在数字选择器
  const existingContainer = document.getElementById(
    "number-selector-container"
  );
  if (existingContainer) {
    const existingToast = document.getElementById("number-selector-toast");
    const existingStyle = document.querySelector("style[data-number-selector]");

    if (existingToast) document.body.removeChild(existingToast);
    if (existingStyle) document.head.removeChild(existingStyle);
    document.body.removeChild(existingContainer);
  }

  // 创建弹窗容器
  const container = document.createElement("div");
  container.id = "number-selector-container";
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 20px;
    z-index: 9999;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
  `;

  // 创建标题栏（可拖拽区域）
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    cursor: move;
    user-select: none;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
  `;

  const title = document.createElement("h3");
  title.textContent = config.title;
  title.style.margin = "0";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    user-select: none;
    padding: 4px;
  `;

  header.appendChild(title);
  header.appendChild(closeBtn);

  // 创建内容区域（三行左对齐布局）
  const content = document.createElement("div");
  content.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  `;

  // 创建三行数字（左对齐，每行独立flex容器）
  const rows = [config.row1, config.row2, config.row3];

  rows.forEach((rowData, rowIndex) => {
    const rowContainer = document.createElement("div");
    rowContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-start; /* 左对齐 */
    `;

    rowData.forEach((num) => {
      const item = document.createElement("div");
      item.style.cssText = `
        width: 40px;
        height: 40px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f9f9f9;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
        user-select: none;
      `;

      if (num === null) {
        item.textContent = "";
        item.style.border = "1px dashed #eee";
        item.style.backgroundColor = "transparent";
        item.style.cursor = "default";
        item.style.pointerEvents = "none";
      } else {
        item.textContent = num;
        item.addEventListener("click", function () {
          this.classList.toggle("active");
        });
      }

      rowContainer.appendChild(item);
    });

    content.appendChild(rowContainer);
  });

  // 创建按钮区域
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  `;

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "复制选中数字";
  copyBtn.style.cssText = `
    padding: 10px 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
    user-select: none;
  `;

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "清空选择";
  clearBtn.style.cssText = `
    padding: 10px 20px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
    user-select: none;
  `;

  buttonContainer.appendChild(copyBtn);
  buttonContainer.appendChild(clearBtn);

  // 创建提示信息区域
  const toast = document.createElement("div");
  toast.id = "number-selector-toast";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 10000;
  `;

  // 添加样式到 head
  const style = document.createElement("style");
  style.setAttribute("data-number-selector", "true");
  style.textContent = `
    #number-selector-container .active {
      color: red;
      border-color: #ff9999;
      background-color: #fff0f0;
    }
    
    #number-selector-container button:hover {
      filter: brightness(0.95);
    }
    
    #number-selector-container button:active {
      filter: brightness(0.9);
    }
    
    #number-selector-toast.show {
      opacity: 1;
    }
  `;

  document.head.appendChild(style);

  // 将所有元素添加到容器
  container.appendChild(header);
  container.appendChild(content);
  container.appendChild(buttonContainer);
  document.body.appendChild(container);
  document.body.appendChild(toast);

  // 实现拖拽功能
  let isDragging = false;
  let offsetX, offsetY;
  let initialLeft, initialTop;
  let containerWidth, containerHeight;

  header.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging = true;
    const rect = container.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    containerWidth = container.offsetWidth;
    containerHeight = container.offsetHeight;
    offsetX = e.clientX - initialLeft;
    offsetY = e.clientY - initialTop;
    container.style.transition = "none";
    container.style.transform = "none";
    container.style.top = `${initialTop}px`;
    container.style.left = `${initialLeft}px`;
    container.classList.add("dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minX = 0;
    const maxX = screenWidth - containerWidth;
    const minY = 0;
    const maxY = screenHeight - containerHeight;
    const constrainedX = Math.max(minX, Math.min(newX, maxX));
    const constrainedY = Math.max(minY, Math.min(newY, maxY));
    container.style.left = `${constrainedX}px`;
    container.style.top = `${constrainedY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      container.style.transition = "transform 0.2s ease";
      container.classList.remove("dragging");
    }
  });

  // 复制选中数字
  copyBtn.addEventListener("click", () => {
    const selectedItems = container.querySelectorAll(".active");
    const selectedNumbers = Array.from(selectedItems).map(
      (item) => item.textContent
    );
    if (selectedNumbers.length === 0) {
      showToast("请先选择要复制的数字！");
      return;
    }
    const numbersString = selectedNumbers.sort((a, b) => a - b).join(",");
    navigator.clipboard
      .writeText(numbersString)
      .then(() => showToast(`已复制: ${numbersString}`))
      .catch(() => showToast("复制失败，请手动复制！"));
  });

  // 清空选择
  clearBtn.addEventListener("click", () => {
    const allItems = container.querySelectorAll(".active");
    allItems.forEach((item) => item.classList.remove("active"));
    showToast("已清空所有选择");
  });

  // 关闭弹窗
  closeBtn.addEventListener("click", () => {
    container.style.opacity = "0";
    container.style.transform = "translate(-50%, -50%) scale(0.9)";
    container.style.transition = "opacity 0.3s, transform 0.3s";
    setTimeout(() => {
      document.body.removeChild(container);
      document.body.removeChild(toast);
      document.head.removeChild(style);
    }, 300);
  });

  // 显示提示
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // 返回控制对象
  return {
    close: () => closeBtn.click(),
    copy: () => copyBtn.click(),
    clear: () => clearBtn.click(),
    getSelectedNumbers: () =>
      Array.from(container.querySelectorAll(".active")).map((item) =>
        Number(item.textContent)
      ),
  };
}
