import React, { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Card, Button, Spin, Select, Tooltip, Switch } from 'antd';
import { CopyOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import './SourceCodeViewer.css';

// 支持的语言
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import scss from 'react-syntax-highlighter/dist/esm/languages/hljs/scss';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';

// 注册语言
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('jsx', javascript); // JSX 使用 javascript 语法
SyntaxHighlighter.registerLanguage('tsx', typescript); // TSX 使用 typescript 语法
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('scss', scss);
SyntaxHighlighter.registerLanguage('html', xml);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('json', json);

export interface SourceCodeViewerProps {
  code: string;
  language?: string;
  errorLine?: number;
  fileName?: string;
  loading?: boolean;
  showLineNumbers?: boolean;
  darkMode?: boolean;
  contextLines?: number;
  onLanguageChange?: (language: string) => void;
}

const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    default:
      return 'javascript';
  }
};

const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({
  code,
  language: propLanguage,
  errorLine,
  fileName,
  loading = false,
  showLineNumbers = true,
  darkMode: propDarkMode,
  contextLines = 5,
  onLanguageChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(propDarkMode ?? true);
  const [language, setLanguage] = useState(
    propLanguage || (fileName ? getLanguageFromFileName(fileName) : 'javascript')
  );

  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    } else if (fileName) {
      setLanguage(getLanguageFromFileName(fileName));
    }
  }, [propLanguage, fileName]);

  useEffect(() => {
    if (propDarkMode !== undefined) {
      setDarkMode(propDarkMode);
    }
  }, [propDarkMode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    // 可以添加复制成功的提示
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // 如果有错误行，计算需要显示的代码范围
  let codeToShow = code;
  let startLine = 1;
  if (errorLine && contextLines > 0) {
    const lines = code.split('\n');
    const start = Math.max(0, errorLine - contextLines - 1);
    const end = Math.min(lines.length, errorLine + contextLines);
    codeToShow = lines.slice(start, end).join('\n');
    startLine = start + 1;
  }

  // 自定义行样式，高亮错误行
  const lineProps = (lineNumber: number) => {
    const style: React.CSSProperties = { display: 'block' };
    if (errorLine && lineNumber === errorLine) {
      style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
      style.borderLeft = '3px solid red';
      style.paddingLeft = '10px';
    }
    return { style };
  };

  return (
    <Card
      className={`source-code-viewer ${expanded ? 'expanded' : ''}`}
      title={
        <div className="source-code-viewer-header">
          <span>{fileName || '源代码'}</span>
          <div className="source-code-viewer-actions">
            <Select
              value={language}
              onChange={handleLanguageChange}
              style={{ width: 120, marginRight: 8 }}
              options={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'jsx', label: 'JSX' },
                { value: 'tsx', label: 'TSX' },
                { value: 'css', label: 'CSS' },
                { value: 'scss', label: 'SCSS' },
                { value: 'html', label: 'HTML' },
                { value: 'json', label: 'JSON' },
              ]}
            />
            <Switch
              checkedChildren="暗色"
              unCheckedChildren="亮色"
              checked={darkMode}
              onChange={toggleDarkMode}
              style={{ marginRight: 8 }}
            />
            <Tooltip title="复制代码">
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
            <Tooltip title={expanded ? '收起' : '展开'}>
              <Button
                icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={toggleExpand}
              />
            </Tooltip>
          </div>
        </div>
      }
      bodyStyle={{ padding: 0, overflow: 'auto' }}
    >
      {loading ? (
        <div className="source-code-viewer-loading">
          <Spin tip="加载源代码中..." />
        </div>
      ) : (
        <div className="source-code-content">
          <SyntaxHighlighter
            language={language}
            style={darkMode ? vs2015 : docco}
            showLineNumbers={showLineNumbers}
            lineNumberStyle={{ color: darkMode ? '#666' : '#999' }}
            lineProps={lineProps}
            startingLineNumber={startLine}
            wrapLines={true}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '14px',
              backgroundColor: darkMode ? '#1E1E1E' : '#FFFFFF',
            }}
          >
            {codeToShow}
          </SyntaxHighlighter>
        </div>
      )}
    </Card>
  );
};

export default SourceCodeViewer;