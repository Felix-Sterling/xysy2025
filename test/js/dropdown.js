// dropdown.js

class DropdownManager {
    constructor() {
        this.dropdowns = {};
        this.activeDropdown = null;
        this.initialized = false;
        this.init();
    }

    init() {
        // 获取所有下拉菜单容器
        const dropdowns = ['province-filter', 'class-filter', 'school-filter'];
        dropdowns.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) {
                const button = dropdown.querySelector('a');
                const content = dropdown.querySelector('.dropdown-content');
                if (button && content) {
                    // 添加搜索框
                    const searchContainer = document.createElement('div');
                    searchContainer.className = 'dropdown-search';
                    const searchInput = document.createElement('input');
                    searchInput.type = 'text';
                    searchInput.placeholder = '搜索...';
                    searchContainer.appendChild(searchInput);
                    content.insertBefore(searchContainer, content.firstChild);

                    // 存储下拉菜单信息
                    this.dropdowns[id] = { element: dropdown, button, content, searchInput };

                    // 绑定事件
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleDropdown(id);
                    });

                    searchInput.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });

                    searchInput.addEventListener('input', (e) => {
                        this.filterItems(id, e.target.value.toLowerCase());
                    });
                }
            }
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // ESC键关闭下拉菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        this.initialized = true;
    }

    toggleDropdown(id) {
        const dropdown = this.dropdowns[id];
        if (!dropdown) return;

        const isActive = dropdown.element.classList.contains('active');
        
        // 关闭所有其他下拉菜单
        this.closeAllDropdowns();

        if (!isActive) {
            dropdown.element.classList.add('active');
            dropdown.searchInput.value = '';
            dropdown.searchInput.focus();
            this.filterItems(id, '');
        }
    }

    closeAllDropdowns() {
        Object.keys(this.dropdowns).forEach(id => {
            this.dropdowns[id].element.classList.remove('active');
        });
    }

    filterItems(id, query) {
        const dropdown = this.dropdowns[id];
        if (!dropdown) return;

        const items = dropdown.content.querySelectorAll('a');
        let hasResults = false;

        items.forEach(item => {
            if (item.parentElement === dropdown.content) { // 排除搜索框
                const text = item.textContent.toLowerCase();
                const matches = text.includes(query);
                item.style.display = matches ? '' : 'none';
                if (matches) hasResults = true;
            }
        });

        // 显示无结果提示
        let noResults = dropdown.content.querySelector('.no-results');
        if (!hasResults) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = '无搜索结果';
                dropdown.content.appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }
}

// 初始化下拉菜单内容
function initDropdowns(data) {
    // 清空现有内容
    ['province-dropdown', 'class-dropdown', 'school-dropdown'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    });

    // 更新省份下拉菜单
    const provinceDropdown = document.getElementById('province-dropdown');
    if (provinceDropdown && provinceData) {
        provinceOrder.forEach(province => {
            if (provinceData[province] && provinceData[province].total > 0) {
                const link = document.createElement('a');
                link.href = '#';
                link.innerHTML = `
                    <span>${province}</span>
                    <span>${provinceData[province].total}人</span>
                `;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 这里添加点击省份时的处理逻辑
                    console.log('Selected province:', province);
                });
                provinceDropdown.appendChild(link);
            }
        });
    }

    // 更新班级下拉菜单
    const classDropdown = document.getElementById('class-dropdown');
    if (classDropdown && classData) {
        Object.keys(classData).sort().forEach(className => {
            const link = document.createElement('a');
            link.href = '#';
            link.innerHTML = `
                <span>${className}</span>
                <span>${classData[className].total}人</span>
            `;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // 这里添加点击班级时的处理逻辑
                console.log('Selected class:', className);
            });
            classDropdown.appendChild(link);
        });
    }

    // 更新学校下拉菜单
    const schoolDropdown = document.getElementById('school-dropdown');
    if (schoolDropdown && schoolData) {
        Object.keys(schoolData).sort((a, b) => schoolData[b].total - schoolData[a].total).forEach(school => {
            const link = document.createElement('a');
            link.href = '#';
            link.innerHTML = `
                <span>${school}</span>
                <span>${schoolData[school].total}人</span>
            `;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // 这里添加点击学校时的处理逻辑
                console.log('Selected school:', school);
            });
            schoolDropdown.appendChild(link);
        });
    }

    // 初始化下拉菜单管理器
    if (!window.dropdownManager || !window.dropdownManager.initialized) {
        window.dropdownManager = new DropdownManager();
    }

    // 下拉菜单交互优化
    ['class-filter', 'province-filter', 'school-filter'].forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const trigger = dropdown.querySelector('a');
        const content = dropdown.querySelector('.dropdown-content');
        // 点击按钮弹出菜单
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            // 关闭其他菜单
            document.querySelectorAll('.dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
        // 点击外部关闭菜单
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
        });
        // 菜单内点击不关闭
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// 下拉菜单项点击跳转
function initDropdownLinks() {
    document.querySelectorAll('#class-dropdown a').forEach(a => {
        a.addEventListener('click', function(e) {
            window.location.href = a.getAttribute('href');
        });
    });
    document.querySelectorAll('#province-dropdown a').forEach(a => {
        a.addEventListener('click', function(e) {
            window.location.href = a.getAttribute('href');
        });
    });
    document.querySelectorAll('#school-dropdown a').forEach(a => {
        a.addEventListener('click', function(e) {
            window.location.href = a.getAttribute('href');
        });
    });
}

// 处理Excel数据并更新下拉菜单
function processDataForDropdowns(data) {
    // 清空并重新处理数据
    classData = {};
    schoolData = {};
    
    data.forEach(item => {
        // 处理班级数据
        if (item['班级']) {
            if (!classData[item['班级']]) {
                classData[item['班级']] = { total: 0, students: [] };
            }
            classData[item['班级']].total++;
            classData[item['班级']].students.push(item);
        }
        
        // 处理学校数据
        if (item['院校']) {
            if (!schoolData[item['院校']]) {
                schoolData[item['院校']] = { total: 0, students: [] };
            }
            schoolData[item['院校']].total++;
            schoolData[item['院校']].students.push(item);
        }
    });

    // 初始化下拉菜单
    initDropdowns(data);
}
