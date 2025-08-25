import React, { useState } from "react";
import {
  Upload,
  Button,
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Divider,
  List,
  Tag,
  Select,
} from "antd";
import { FolderOutlined, CloudUploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { apiClient } from "../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

interface SourcemapUploadProps {
  /** 项目ID */
  projectId?: string;
  /** 上传完成回调 */
  onUploadComplete?: (result: any) => void;
}

/**
 * Sourcemap上传组件
 * 支持单个文件、批量文件和压缩包上传
 */
export const SourcemapUpload: React.FC<SourcemapUploadProps> = ({
  projectId,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"single" | "batch" | "archive">(
    "single"
  );
  const [archiveType, setArchiveType] = useState<string>("zip");
  const [uploadResult, setUploadResult] = useState<any>(null);

  /**
   * 处理单个Sourcemap文件上传
   */
  const handleSingleUpload = async (file: File) => {
    if (!projectId) {
      message.error("请先选择项目");
      return false;
    }

    if (!file.name.endsWith(".map")) {
      message.error("请上传有效的Sourcemap文件 (.map)");
      return false;
    }

    setUploading(true);

    try {
      // 读取文件内容并转换为base64
      const content = await readFileAsBase64(file);

      // 调用API上传
      const result = await apiClient.sourcemapUpload.upload({
        projectId,
        sourcemap: content,
        fileName: file.name,
        filePath: "",
      });

      setUploadResult(result);
      onUploadComplete?.(result);
      message.success(`Sourcemap文件 ${file.name} 上传成功`);
    } catch (error: any) {
      console.error("上传失败:", error);
      message.error(`文件上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }

    return false;
  };

  /**
   * 处理压缩包上传
   */
  const handleArchiveUpload = async (file: File) => {
    if (!projectId) {
      message.error("请先选择项目");
      return false;
    }

    // 验证压缩包格式
    const validExtensions = [".zip", ".tar", ".gz", ".rar", ".7z"];
    const isValidArchive = validExtensions.some((ext) =>
      file.name.endsWith(ext)
    );

    if (!isValidArchive) {
      message.error("请上传有效的压缩包文件 (zip, tar, gz, rar, 7z)");
      return false;
    }

    setUploading(true);

    try {
      // 读取文件内容并转换为base64
      const content = await readFileAsBase64(file);

      // 调用API上传压缩包
      const result = await apiClient.sourcemapUpload.uploadArchive({
        projectId,
        archive: content,
        fileName: file.name,
        archiveType: archiveType,
      });

      setUploadResult(result);
      onUploadComplete?.(result);
      console.log("压缩包上传结果:", result);
      message.success(
        `压缩包 ${file.name} 上传成功，处理了 ${result?.processedFiles?.length || 0} 个文件`
      );
    } catch (error: any) {
      console.error("上传失败:", error);
      message.error(`压缩包上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }

    return false;
  };

  /**
   * 处理批量文件上传
   */
  const handleBatchUpload = async (files: File[]) => {
    if (!projectId) {
      message.error("请先选择项目");
      return false;
    }

    // 过滤出.map文件
    const mapFiles = files.filter((file) => file.name.endsWith(".map"));

    if (mapFiles.length === 0) {
      message.error("请选择至少一个Sourcemap文件 (.map)");
      return false;
    }

    setUploading(true);

    try {
      const uploadPromises = mapFiles.map(async (file) => {
        const content = await readFileAsBase64(file);
        return {
          projectId,
          sourcemap: content,
          fileName: file.name,
          filePath: "",
        };
      });

      const uploadData = await Promise.all(uploadPromises);

      // 调用批量上传API
      const result = await apiClient.sourcemapUpload.batchUpload({
        projectId,
        files: uploadData,
      });

      setUploadResult(result);
      onUploadComplete?.(result);
      message.success(`批量上传成功，处理了 ${mapFiles.length} 个文件`);
    } catch (error: any) {
      console.error("批量上传失败:", error);
      message.error(`批量上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }

    return false;
  };

  /**
   * 读取文件内容为base64
   */
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // 提取base64部分
        const base64Content = content.split(",")[1] || content;
        resolve(base64Content);
      };
      reader.onerror = (e) => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });
  };

  /**
   * 根据上传类型获取上传配置
   */
  const getUploadProps = (): UploadProps => {
    const commonProps: UploadProps = {
      showUploadList: false,
      disabled: uploading,
    };

    switch (uploadType) {
      case "single":
        return {
          ...commonProps,
          beforeUpload: handleSingleUpload,
          multiple: false,
          accept: ".map",
          maxCount: 1,
        };

      case "batch":
        return {
          ...commonProps,
          beforeUpload: (file) => {
            // 批量上传需要手动处理多个文件
            return false;
          },
          multiple: true,
          accept: ".map",
          maxCount: 20,
        };

      case "archive":
        return {
          ...commonProps,
          beforeUpload: handleArchiveUpload,
          multiple: false,
          accept: ".zip,.tar,.gz,.rar,.7z",
          maxCount: 1,
        };

      default:
        return commonProps;
    }
  };

  /**
   * 渲染上传结果
   */
  const renderUploadResult = () => {
    if (!uploadResult) return null;

    return (
      <Card title="上传结果" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text strong>{uploadResult.message}</Text>

          {uploadResult?.processedFiles && (
            <div>
              <Divider />
              <Text strong>处理文件详情 (共 {uploadResult.processedFiles.length} 个文件):</Text>
              <List
                size="small"
                dataSource={uploadResult.processedFiles}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>{item.fileName}</Text>
                          <Tag color={item.success ? "green" : "red"}>
                            {item.success ? "成功" : "失败"}
                          </Tag>
                        </Space>
                      }
                      description={
                        item.error ? (
                          <Text type="danger">{item.error}</Text>
                        ) : (
                          <Text type="secondary">处理完成</Text>
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div>
      <Card title="Sourcemap文件上传">
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 上传类型选择 */}
          <Row gutter={16} align="middle">
            <Col>
              <Text strong>上传类型:</Text>
            </Col>
            <Col>
              <Select
                value={uploadType}
                onChange={setUploadType}
                style={{ width: 120 }}
                disabled={uploading}
              >
                <Option value="single">单个文件</Option>
                <Option value="batch">批量文件</Option>
                <Option value="archive">压缩包</Option>
              </Select>
            </Col>

            {uploadType === "archive" && (
              <>
                <Col>
                  <Text strong>压缩格式:</Text>
                </Col>
                <Col>
                  <Select
                    value={archiveType}
                    onChange={setArchiveType}
                    style={{ width: 100 }}
                    disabled={uploading}
                  >
                    <Option value="zip">ZIP</Option>
                    <Option value="tar">TAR</Option>
                    <Option value="gz">GZ</Option>
                    <Option value="rar">RAR</Option>
                    <Option value="7z">7Z</Option>
                  </Select>
                </Col>
              </>
            )}
          </Row>

          {/* 上传说明 */}
          {uploadType === "single" && (
            <Alert
              message="支持上传单个.map格式的Sourcemap文件"
              type="info"
              showIcon
            />
          )}

          {uploadType === "batch" && (
            <Alert
              message="支持批量上传多个.map文件，最多20个文件"
              type="info"
              showIcon
            />
          )}

          {uploadType === "archive" && (
            <Alert
              message={`支持上传${archiveType.toUpperCase()}格式的压缩包，自动解压并处理其中的.map文件`}
              type="info"
              showIcon
            />
          )}

          {/* 上传按钮 */}
          <Upload {...getUploadProps()}>
            <Button
              icon={<CloudUploadOutlined />}
              loading={uploading}
              type="primary"
              size="large"
            >
              {uploading ? "上传中..." : "选择文件上传"}
            </Button>
          </Upload>

          {/* 批量上传的特殊处理 */}
          {uploadType === "batch" && (
            <Button
              icon={<FolderOutlined />}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ".map";
                input.onchange = (e) => {
                  const files = Array.from(
                    (e.target as HTMLInputElement).files || []
                  );
                  handleBatchUpload(files);
                };
                input.click();
              }}
              disabled={uploading}
            >
              选择多个文件
            </Button>
          )}
        </Space>
      </Card>

      {/* 上传结果展示 */}
      {renderUploadResult()}
    </div>
  );
};
