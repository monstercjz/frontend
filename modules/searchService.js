// SearchService.js
export class SearchService {
  constructor() {
    this.searchForm = document.querySelector('.search-form');
    this.searchFormInput = document.querySelector('.search-form__input');
    this.hideTimeout = null;
    this.init();
  }

  /**
   * 初始化搜索功能
   */
  init() {
    // 输入时过滤网站并重置计时器
    this.searchFormInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      this.filterSites(searchTerm);
      this.resetInactivityTimer();
    });

    // 监听键盘事件以重置计时器
    this.searchFormInput.addEventListener('keydown', () => {
      this.resetInactivityTimer();
    });

    // 点击搜索框时重置计时器
    this.searchFormInput.addEventListener('click', () => {
      this.resetInactivityTimer();
    });

    // 鼠标进入搜索区域时重置计时器
    this.searchForm.addEventListener('mouseenter', () => {
      if (this.searchForm.classList.contains('expanded')) {
        this.resetInactivityTimer();
      }
    });
  }

  /**
   * 根据搜索词过滤网站
   * @param {string} searchTerm - 搜索关键词
   */
  filterSites(searchTerm) {
    const siteElements = document.querySelectorAll('.website-item'); // 需要扩大范围
    siteElements.forEach((element) => {
      const siteLink = element.querySelector('a');
      const siteName = siteLink.textContent.toLowerCase();
      const siteUrl = siteLink.href.toLowerCase();

      if (siteName.includes(searchTerm) || siteUrl.includes(searchTerm)) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }

  /**
   * 重置无操作计时器
   * 5秒无操作后自动隐藏搜索框
   */
  resetInactivityTimer() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.searchForm.classList.remove('expanded');
    }, 5000);
  }
}
/**
 * 初始化搜索功能（动态加载模块）
 */
let searchServiceInstance = null;

async function loadAndInitSearchService() {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService(); // 初始化搜索功能
  }
}

/**
 * 绑定搜索图标的点击事件
 */
export function setupSearchIconClick() {
  const searchForm = document.querySelector('.search-form');
  // const searchFormIcon = document.querySelector('.search-form__icon');

  // 点击搜索图标时立即响应
  
    // 直接切换搜索框状态
    searchForm.classList.toggle('expanded');
    if (searchForm.classList.contains('expanded')) {
      const searchFormInput = document.querySelector('.search-form__input');
      searchFormInput.focus();
    }

    // 异步加载模块
    loadAndInitSearchService();
  
}