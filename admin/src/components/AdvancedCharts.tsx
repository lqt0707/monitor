/**
 * 高级图表组件库
 * 提供多种类型的数据可视化图表组件
 */

import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

const { Title, Text } = Typography;

/**
 * 漏斗图组件属性接口
 */
interface FunnelChartProps {
  title?: string;
  data: Array<{ name: string; value: number }>;
  height?: string;
}

/**
 * 漏斗图组件
 * @param props 组件属性
 * @returns JSX.Element
 */
export const FunnelChart: React.FC<FunnelChartProps> = ({ 
  title = '转化漏斗', 
  data, 
  height = '400px' 
}) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c}%'
    },
    toolbox: {
      feature: {
        dataView: { readOnly: false },
        restore: {},
        saveAsImage: {}
      }
    },
    legend: {
      data: data.map(item => item.name),
      top: 'bottom'
    },
    series: [
      {
        name: title,
        type: 'funnel',
        left: '10%',
        top: 60,
        width: '80%',
        height: '60%',
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside'
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid'
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          label: {
            fontSize: 20
          }
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `hsl(${200 + index * 30}, 70%, 60%)` },
              { offset: 1, color: `hsl(${200 + index * 30}, 70%, 40%)` }
            ])
          }
        }))
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 仪表盘图组件属性接口
 */
interface GaugeChartProps {
  title?: string;
  value: number;
  max?: number;
  unit?: string;
  height?: string;
  thresholds?: Array<{ value: number; color: string; label: string }>;
}

/**
 * 仪表盘图组件
 * @param props 组件属性
 * @returns JSX.Element
 */
export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  title = '性能指标', 
  value, 
  max = 100, 
  unit = '%',
  height = '400px',
  thresholds = [
    { value: 30, color: '#52c41a', label: '良好' },
    { value: 70, color: '#faad14', label: '警告' },
    { value: 100, color: '#ff4d4f', label: '危险' }
  ]
}) => {
  const getColor = (val: number) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (val <= thresholds[i].value) {
        return thresholds[i].color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  };

  const option = {
    title: {
      text: title,
      left: 'center',
      top: '10%',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    series: [
      {
        name: title,
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -40,
        min: 0,
        max,
        splitNumber: 5,
        itemStyle: {
          color: getColor(value)
        },
        progress: {
          show: true,
          width: 30
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 30
          }
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        splitLine: {
          distance: -52,
          length: 14,
          lineStyle: {
            width: 3,
            color: '#999'
          }
        },
        axisLabel: {
          distance: -20,
          color: '#999',
          fontSize: 12
        },
        anchor: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '-15%'],
          fontSize: 30,
          fontWeight: 'bolder',
          formatter: `{value}${unit}`,
          color: 'inherit'
        },
        data: [
          {
            value
          }
        ]
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 树图组件属性接口
 */
interface TreemapChartProps {
  title?: string;
  data: any;
  height?: string;
}

/**
 * 树图组件
 * @param props 组件属性
 * @returns JSX.Element
 */
export const TreemapChart: React.FC<TreemapChartProps> = ({ 
  title = '层级数据', 
  data, 
  height = '400px' 
}) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      formatter: function (info: any) {
        const value = info.value;
        const treePathInfo = info.treePathInfo;
        const treePath = [];
        
        for (let i = 1; i < treePathInfo.length; i++) {
          treePath.push(treePathInfo[i].name);
        }
        
        return [
          '<div class="tooltip-title">' + treePath.join(' > ') + '</div>',
          '数值: ' + value
        ].join('');
      }
    },
    series: [
      {
        name: title,
        type: 'treemap',
        visibleMin: 300,
        label: {
          show: true,
          formatter: '{b}'
        },
        itemStyle: {
          borderColor: '#fff'
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5
            }
          },
          {
            itemStyle: {
              gapWidth: 1
            }
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        ],
        data
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 桑基图组件属性接口
 */
interface SankeyChartProps {
  title?: string;
  data: {
    nodes: Array<{ name: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  height?: string;
}

/**
 * 桑基图组件
 * @param props 组件属性
 * @returns JSX.Element
 */
export const SankeyChart: React.FC<SankeyChartProps> = ({ 
  title = '流量分析', 
  data, 
  height = '400px' 
}) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        data: data.nodes,
        links: data.links,
        emphasis: {
          focus: 'adjacency'
        },
        levels: [
          {
            depth: 0,
            itemStyle: {
              color: '#fbb4ae'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 1,
            itemStyle: {
              color: '#b3cde3'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          },
          {
            depth: 2,
            itemStyle: {
              color: '#ccebc5'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.6
            }
          }
        ],
        lineStyle: {
          curveness: 0.5
        }
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 词云图组件属性接口
 */
interface WordCloudChartProps {
  title?: string;
  data: Array<{ name: string; value: number }>;
  height?: string;
}

/**
 * 词云图组件（使用散点图模拟）
 * @param props 组件属性
 * @returns JSX.Element
 */
export const WordCloudChart: React.FC<WordCloudChartProps> = ({ 
  title = '关键词分析', 
  data, 
  height = '400px' 
}) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    xAxis: {
      show: false,
      type: 'value'
    },
    yAxis: {
      show: false,
      type: 'value'
    },
    series: [
      {
        type: 'scatter',
        symbolSize: function (val: any) {
          return Math.sqrt(val[2]) * 2;
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'inside',
          fontSize: function (params: any) {
            return Math.max(Math.sqrt(params.data[2]) / 2, 8);
          },
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(120, 36, 50, 0.5)',
          shadowOffsetY: 5,
          color: function (params: any) {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
            return colors[params.dataIndex % colors.length];
          }
        },
        data: data.map((item, index) => [
          Math.random() * 100,
          Math.random() * 100,
          item.value,
          item.name
        ])
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 组合图表组件属性接口
 */
interface ComboChartProps {
  title?: string;
  data: {
    categories: string[];
    series: Array<{
      name: string;
      type: 'bar' | 'line';
      data: number[];
      yAxisIndex?: number;
    }>;
  };
  height?: string;
}

/**
 * 组合图表组件（柱状图+折线图）
 * @param props 组件属性
 * @returns JSX.Element
 */
export const ComboChart: React.FC<ComboChartProps> = ({ 
  title = '组合分析', 
  data, 
  height = '400px' 
}) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    toolbox: {
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    legend: {
      data: data.series.map(s => s.name),
      top: 30
    },
    xAxis: [
      {
        type: 'category',
        data: data.categories,
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '数量',
        min: 0,
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '比率',
        min: 0,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: data.series.map((s, index) => ({
      ...s,
      itemStyle: {
        color: s.type === 'bar' 
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `hsl(${200 + index * 60}, 70%, 60%)` },
              { offset: 1, color: `hsl(${200 + index * 60}, 70%, 40%)` }
            ])
          : `hsl(${200 + index * 60}, 70%, 50%)`
      }
    }))
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

/**
 * 高级图表展示组件
 * @returns JSX.Element
 */
export const AdvancedChartsDemo: React.FC = () => {
  // 示例数据
  const funnelData = [
    { name: '访问', value: 100 },
    { name: '咨询', value: 80 },
    { name: '订单', value: 60 },
    { name: '点击', value: 40 },
    { name: '购买', value: 20 }
  ];

  const treemapData = [
    {
      name: '前端错误',
      value: 1212,
      children: [
        { name: 'JavaScript错误', value: 560 },
        { name: 'CSS错误', value: 340 },
        { name: '资源加载错误', value: 312 }
      ]
    },
    {
      name: '后端错误',
      value: 834,
      children: [
        { name: 'API错误', value: 445 },
        { name: '数据库错误', value: 234 },
        { name: '服务器错误', value: 155 }
      ]
    }
  ];

  const sankeyData = {
    nodes: [
      { name: '首页' },
      { name: '产品页' },
      { name: '购物车' },
      { name: '结算页' },
      { name: '支付成功' },
      { name: '支付失败' }
    ],
    links: [
      { source: '首页', target: '产品页', value: 1000 },
      { source: '产品页', target: '购物车', value: 600 },
      { source: '购物车', target: '结算页', value: 400 },
      { source: '结算页', target: '支付成功', value: 300 },
      { source: '结算页', target: '支付失败', value: 100 }
    ]
  };

  const wordCloudData = [
    { name: 'JavaScript', value: 100 },
    { name: 'React', value: 80 },
    { name: 'Vue', value: 70 },
    { name: 'Angular', value: 60 },
    { name: 'Node.js', value: 90 },
    { name: 'TypeScript', value: 85 },
    { name: 'CSS', value: 75 },
    { name: 'HTML', value: 65 }
  ];

  const comboData = {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      {
        name: '错误数量',
        type: 'bar' as const,
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '解决率',
        type: 'line' as const,
        yAxisIndex: 1,
        data: [85, 88, 92, 87, 95, 89]
      }
    ]
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>高级图表组件</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="转化漏斗分析">
          <FunnelChart data={funnelData} />
        </Card>

        <Card title="性能监控仪表盘">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <GaugeChart title="CPU使用率" value={75} />
            </div>
            <div style={{ flex: 1 }}>
              <GaugeChart title="内存使用率" value={45} />
            </div>
            <div style={{ flex: 1 }}>
              <GaugeChart title="错误率" value={12} thresholds={[
                { value: 5, color: '#52c41a', label: '良好' },
                { value: 15, color: '#faad14', label: '警告' },
                { value: 30, color: '#ff4d4f', label: '危险' }
              ]} />
            </div>
          </div>
        </Card>

        <Card title="错误分布树图">
          <TreemapChart data={treemapData} />
        </Card>

        <Card title="用户流量桑基图">
          <SankeyChart data={sankeyData} />
        </Card>

        <Card title="技术栈词云">
          <WordCloudChart data={wordCloudData} />
        </Card>

        <Card title="错误趋势组合分析">
          <ComboChart data={comboData} />
        </Card>
      </Space>
    </div>
  );
};

export default {
  FunnelChart,
  GaugeChart,
  TreemapChart,
  SankeyChart,
  WordCloudChart,
  ComboChart,
  AdvancedChartsDemo
};