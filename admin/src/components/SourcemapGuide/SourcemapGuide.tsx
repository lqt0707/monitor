import React, { useState } from "react";
import {
  Card,
  Collapse,
  Typography,
  Space,
  Button,
  Tag,
  Alert,
  Divider,
  Steps,
  message,
} from "antd";
import {
  CodeOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import BuildConfigGenerator from "../../utils/buildConfigGenerator";
import "./SourcemapGuide.css";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

interface SourcemapGuideProps {
  projectId?: string;
  projectType?: "react" | "vue" | "angular" | "generic";
  className?: string;
}

const SourcemapGuide: React.FC<SourcemapGuideProps> = ({
  projectId,
  projectType = "generic",
  className = "",
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedConfig, setGeneratedConfig] = useState<string>("");
  const [configType, setConfigType] = useState<"webpack" | "rollup" | "vite">(
    "webpack"
  );

  const buildConfigGenerator = new BuildConfigGenerator();

  // 生成构建配置
  const generateBuildConfig = () => {
    const options = {
      projectType,
      entryPoint: "src/index.js",
      outputDir: "dist",
      sourcemapType: "source-map" as const,
      minify: true,
      target: ["web"],
      useTypeScript: true,
      useCSS: true,
      useAssets: true,
    };

    let config = "";
    switch (configType) {
      case "webpack":
        config = buildConfigGenerator.generateWebpackConfig(options);
        break;
      case "rollup":
        config = buildConfigGenerator.generateRollupConfig(options);
        break;
      case "vite":
        config = buildConfigGenerator.generateViteConfig(options);
        break;
    }

    setGeneratedConfig(config);
    message.success("构建配置生成成功！");
  };

  // 复制配置到剪贴板
  const copyConfig = () => {
    navigator.clipboard.writeText(generatedConfig);
    message.success("配置已复制到剪贴板");
  };

  // 下载配置文件
  const downloadConfig = () => {
    const blob = new Blob([generatedConfig], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${configType}.config.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("配置文件下载成功");
  };

  // 生成构建脚本
  const generateBuildScript = () => {
    const options = {
      projectType,
      entryPoint: "src/index.js",
      outputDir: "dist",
      sourcemapType: "source-map" as const,
      minify: true,
      target: ["web"],
      projectId: projectId || "your-project",
      version: "1.0.0",
    };

    const script = buildConfigGenerator.generateBuildScript(options);

    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "build-and-upload.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("构建脚本下载成功");
  };

  const steps = [
    {
      title: "配置构建工具",
      description: "在项目中启用sourcemap生成",
      content: (
        <div className="step-content">
          <Title level={4}>步骤1: 配置构建工具</Title>
          <Paragraph>
            根据您的项目类型，选择合适的构建工具并配置sourcemap生成：
          </Paragraph>

          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="config-selector">
              <Text strong>选择构建工具：</Text>
              <Space>
                <Button
                  type={configType === "webpack" ? "primary" : "default"}
                  onClick={() => setConfigType("webpack")}
                >
                  Webpack
                </Button>
                <Button
                  type={configType === "rollup" ? "primary" : "default"}
                  onClick={() => setConfigType("rollup")}
                >
                  Rollup
                </Button>
                <Button
                  type={configType === "vite" ? "primary" : "default"}
                  onClick={() => setConfigType("vite")}
                >
                  Vite
                </Button>
              </Space>
            </div>

            <Button
              type="primary"
              icon={<CodeOutlined />}
              onClick={generateBuildConfig}
            >
              生成构建配置
            </Button>

            {generatedConfig && (
              <div className="generated-config">
                <div className="config-header">
                  <Text strong>生成的配置文件：</Text>
                  <Space>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={copyConfig}
                    >
                      复制
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={downloadConfig}
                    >
                      下载
                    </Button>
                  </Space>
                </div>
                <pre className="config-content">
                  <code>{generatedConfig}</code>
                </pre>
              </div>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: "执行构建",
      description: "运行构建命令生成sourcemap",
      content: (
        <div className="step-content">
          <Title level={4}>步骤2: 执行构建</Title>
          <Paragraph>使用生成的配置文件执行构建命令：</Paragraph>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Alert
              message="构建命令"
              description={
                <div>
                  <Text code>npm run build</Text> 或{" "}
                  <Text code>yarn build</Text>
                  <br />
                  <Text type="secondary">
                    确保package.json中包含相应的构建脚本
                  </Text>
                </div>
              }
              type="info"
              showIcon
            />

            <div className="build-script-section">
              <Text strong>自动构建脚本：</Text>
              <Button icon={<DownloadOutlined />} onClick={generateBuildScript}>
                下载构建脚本
              </Button>
            </div>

            <Alert
              message="构建产物检查"
              description="构建完成后，检查dist目录中是否包含.js文件和对应的.map文件"
              type="success"
              showIcon
            />
          </Space>
        </div>
      ),
    },
    {
      title: "打包上传",
      description: "将构建产物打包并上传到系统",
      content: (
        <div className="step-content">
          <Title level={4}>步骤3: 打包上传</Title>
          <Paragraph>
            将构建产物打包成压缩文件并上传到源代码管理系统：
          </Paragraph>

          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="upload-checklist">
              <Text strong>上传前检查清单：</Text>
              <ul>
                <li>✅ 构建成功，无错误信息</li>
                <li>✅ 包含所有必要的JS文件</li>
                <li>✅ 每个JS文件都有对应的.map文件</li>
                <li>✅ 文件路径结构正确</li>
                <li>✅ 版本信息一致</li>
              </ul>
            </div>

            <Alert
              message="上传方式"
              description={
                <div>
                  <Text strong>推荐：</Text>
                  使用源代码上传功能，同时上传JS文件和sourcemap文件
                  <br />
                  <Text strong>备选：</Text>分别上传源代码和sourcemap文件
                </div>
              }
              type="info"
              showIcon
            />

            <div className="upload-tips">
              <Text strong>上传提示：</Text>
              <ul>
                <li>确保JS文件和sourcemap文件版本一致</li>
                <li>保持文件路径结构不变</li>
                <li>验证上传后的文件完整性</li>
                <li>测试错误定位功能是否正常</li>
              </ul>
            </div>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <CodeOutlined />
          <span>Sourcemap生成指引</span>
          <Tag color="blue">推荐方案</Tag>
        </Space>
      }
      className={`sourcemap-guide ${className}`}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setCurrentStep(2)}
          >
            查看上传步骤
          </Button>
        </Space>
      }
    >
      <div className="guide-content">
        {/* 方案说明 */}
        <Alert
          message="推荐方案：用户手动生成上传"
          description="使用成熟的构建工具生成sourcemap文件，然后上传到系统。这种方式具有可靠性高、性能影响小、维护简单等优势。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 步骤导航 */}
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          style={{ marginBottom: 24 }}
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
            />
          ))}
        </Steps>

        {/* 步骤内容 */}
        <div className="step-content-wrapper">{steps[currentStep].content}</div>

        {/* 快速导航 */}
        <Divider />
        <div className="quick-navigation">
          <Text strong>快速导航：</Text>
          <Space>
            {steps.map((step, index) => (
              <Button
                key={index}
                size="small"
                type={currentStep === index ? "primary" : "default"}
                onClick={() => setCurrentStep(index)}
              >
                {step.title}
              </Button>
            ))}
          </Space>
        </div>

        {/* 常见问题 */}
        <Divider />
        <Collapse ghost>
          <Panel header="常见问题" key="faq">
            <div className="faq-content">
              <div className="faq-item">
                <Text strong>Q: 为什么推荐手动生成而不是系统自动生成？</Text>
                <Paragraph>
                  A: 手动生成方案具有以下优势：
                  <ul>
                    <li>技术成熟，基于现有构建工具生态</li>
                    <li>性能友好，不影响系统性能</li>
                    <li>维护简单，无需维护复杂的构建工具集成</li>
                    <li>用户可控，可根据项目需求定制配置</li>
                    <li>标准化，符合前端工程化最佳实践</li>
                  </ul>
                </Paragraph>
              </div>

              <div className="faq-item">
                <Text strong>Q: 如何确保JS文件和sourcemap文件版本一致？</Text>
                <Paragraph>
                  A: 建议采用以下策略：
                  <ul>
                    <li>使用相同的构建命令和配置</li>
                    <li>在同一个构建流程中生成所有文件</li>
                    <li>使用版本标签或构建ID标识</li>
                    <li>上传前验证文件完整性</li>
                  </ul>
                </Paragraph>
              </div>

              <div className="faq-item">
                <Text strong>Q: 支持哪些构建工具？</Text>
                <Paragraph>
                  A: 当前支持以下主流构建工具：
                  <ul>
                    <li>
                      <Tag color="blue">Webpack</Tag> - 最流行的模块打包工具
                    </li>
                    <li>
                      <Tag color="green">Rollup</Tag> - 适合库和应用的打包工具
                    </li>
                    <li>
                      <Tag color="orange">Vite</Tag> - 现代化的前端构建工具
                    </li>
                    <li>
                      <Tag color="purple">其他</Tag> - 支持自定义配置
                    </li>
                  </ul>
                </Paragraph>
              </div>
            </div>
          </Panel>
        </Collapse>
      </div>
    </Card>
  );
};

export default SourcemapGuide;
