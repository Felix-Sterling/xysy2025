// main.js
// 依赖 ECharts 和 SheetJS

// 省份顺序可自定义，默认按拼音排序
const provinceOrder = [
    '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
    '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
    '河南', '湖北', '湖南', '广东', '广西', '海南',
    '重庆', '四川', '贵州', '云南', '西藏',
    '陕西', '甘肃', '青海', '宁夏', '新疆'
];

let mapChart;
let provinceData = {};
let updateTime = '--';
let classData = {};
let schoolData = {};

// 隐藏初始化界面
function hideInitOverlay() {
    const overlay = document.querySelector('.init-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

// 初始化地图，返回Promise
function initMapAsync() {
    return new Promise((resolve, reject) => {
        try {
            mapChart = echarts.init(document.getElementById('main-map'));
            fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
                .then(res => res.json())
                .then(chinaJson => {
                    echarts.registerMap('china', chinaJson);
                    resolve();
                })
                .catch(reject);
        } catch (err) {
            reject(err);
        }
    });
}

// 渲染地图
function renderMap() {
    // 生成每个省份不同的颜色
    const colorPalette = [
        '#1976d2','#43a047','#e53935','#8e24aa','#fbc02d','#00897b','#d81b60',
        '#3949ab','#f57c00','#7cb342','#00acc1','#c0ca33','#6d4c41','#fb8c00',
        '#039be5','#c62828','#5e35b1','#388e3c','#fdd835','#f06292','#455a64',
        '#ffa726','#8d6e63','#bdbdbd','#00e676','#ff7043','#9e9d24','#00bcd4','#ab47bc','#ffb300'
    ];
    // 自动检测 ECharts 版本，兼容 itemStyle.color/areaColor
    const isEcharts5 = echarts.version && echarts.version.startsWith('5');
    const data = provinceOrder.map((prov, idx) => {
        const colorKey = isEcharts5 ? 'color' : 'areaColor';
        return {
            name: prov,
            value: provinceData[prov]?.total || 0,
            schools: provinceData[prov]?.schools || [],
            itemStyle: {
                [colorKey]: colorPalette[idx % colorPalette.length],
                borderColor: '#fff',
                borderWidth: 1.5,
                shadowColor: colorPalette[idx % colorPalette.length],
                shadowBlur: 12
            }
        };
    });
    mapChart.setOption({
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (!params.data || !params.data.schools) return params.name;
                let html = `<div class='echarts-tooltip'><div class='tooltip-title'>${params.name}</div><ul class='tooltip-list'>`;
                let showCount = 5;
                params.data.schools.slice(0, showCount).forEach(sch => {
                    html += `<li>${sch.name}：${sch.count}</li>`;
                });
                html += '</ul>';
                if (params.data.schools.length > showCount) {
                    html += `<span class='tooltip-more' onclick="window.location.href='province.html?province=${params.name}'">查看全部</span>`;
                }
                html += '</div>';
                return html;
            }
        },
        series: [{
            type: 'map',
            map: 'china',
            roam: true,
            label: {
                show: true,
                formatter: function(params) {
                    // 只显示省份名，人数放在悬浮框，避免重叠
                    return params.name;
                },
                fontSize: 15,
                color: '#fff',
                fontWeight: 'bold',
                fontFamily: 'Inter, Microsoft YaHei, Arial, sans-serif',
                backgroundColor: 'rgba(0,0,0,0.18)',
                borderRadius: 6,
                padding: [2,6],
                shadowColor: '#000',
                shadowBlur: 6
            },
            emphasis: {
                label: { show: true },
                itemStyle: { borderColor: '#1976d2', borderWidth: 2 }
            },
            data: data
        }]
    });
}

// 加载本地Excel数据，返回Promise
function loadExcelDataAsync() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('data/data.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            // 统计数据
            provinceData = {};
            json.forEach(row => {
                const province = row['省份'];
                const school = row['院校'];
                if (!province || !school) return;
                if (!provinceData[province]) provinceData[province] = { total: 0, schools: [] };
                let sch = provinceData[province].schools.find(s => s.name === school);
                if (!sch) {
                    sch = { name: school, count: 0 };
                    provinceData[province].schools.push(sch);
                }
                sch.count++;
                provinceData[province].total++;
            });
            Object.values(provinceData).forEach(prov => {
                prov.schools.sort((a, b) => b.count - a.count);
            });
            updateTime = new Date().toLocaleString();
            document.querySelector('.navbar-update').textContent = '数据更新时间：' + updateTime;
            processDataForDropdowns(json);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

window.onload = async function() {
    try {
        document.querySelector('.init-overlay').style.opacity = '1';
        await Promise.all([
            initMapAsync(),
            loadExcelDataAsync()
        ]);
        renderMap();
        hideInitOverlay();
    } catch (error) {
        console.error('加载数据失败:', error);
        document.querySelector('.loading-text').textContent = '数据加载失败，请刷新页面重试';
    }
};
