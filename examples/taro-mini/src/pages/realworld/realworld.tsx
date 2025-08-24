import { View, Text, Button, Input, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import "./realworld.scss";

/**
 * 真实应用场景测试页面
 * 演示SDK全局自动监控的各种场景，无需手动调用SDK方法
 */
function RealWorldTest() {
  const [userInput, setUserInput] = useState("");
  const [todoList, setTodoList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 页面加载时的初始化 - SDK会自动监控页面性能
  useEffect(() => {
    console.log("🏠 页面加载完成 - SDK会自动监控页面性能");

    // 模拟获取初始数据
    fetchUserProfile();
  }, []);

  /**
   * 模拟正常的API调用 - SDK会自动监控网络性能
   */
  const fetchUserProfile = async () => {
    try {
      const response = await Taro.request({
        url: "https://jsonplaceholder.typicode.com/users/1",
        method: "GET",
      });

      console.log("✅ 获取用户信息成功:", response.data);
      // SDK会自动监控这个成功的网络请求
    } catch (error) {
      console.error("❌ 获取用户信息失败:", error);
      // SDK会自动捕获这个错误
    }
  };

  /**
   * 模拟会触发网络错误的请求 - SDK会自动捕获
   */
  const fetchInvalidData = async () => {
    setLoading(true);

    try {
      // 故意请求一个不存在的接口
      await Taro.request({
        url: "https://nonexistent-domain-12345.com/api/data",
        method: "GET",
        timeout: 5000,
      });
    } catch (error) {
      // 这个错误会被SDK自动捕获
      console.error("网络请求失败:", error);

      Taro.showToast({
        title: "网络异常",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 模拟JavaScript运行时错误 - SDK会自动捕获
   */
  const triggerJSError = () => {
    // 这里故意制造一个运行时错误
    setTimeout(() => {
      const obj: any = null;
      // 这行代码会抛出TypeError，SDK会自动捕获
      console.log(obj.nonExistentProperty.someMethod());
    }, 100);
  };

  /**
   * 模拟Promise异常 - SDK会自动捕获
   */
  const triggerPromiseError = async () => {
    // 创建一个会被拒绝的Promise
    const asyncTask = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("异步任务执行失败"));
      }, 1000);
    });

    // 不使用try-catch，让Promise被拒绝
    // SDK会自动捕获未处理的Promise拒绝
    asyncTask.then((result) => {
      console.log("任务成功:", result);
    });
    // 故意不添加.catch，让SDK捕获未处理的拒绝
  };

  /**
   * 模拟添加待办事项 - SDK会自动监控用户行为
   */
  const addTodo = () => {
    if (userInput.trim()) {
      setTodoList([...todoList, userInput.trim()]);
      setUserInput("");

      // SDK会自动监控这个用户交互行为
      console.log("✅ 添加待办事项:", userInput);
    }
  };

  /**
   * 模拟删除待办事项 - SDK会自动监控用户行为
   */
  const deleteTodo = (index: number) => {
    const newList = todoList.filter((_, i) => i !== index);
    setTodoList(newList);

    // SDK会自动监控这个用户交互行为
    console.log("🗑️ 删除待办事项:", index);
  };

  /**
   * 模拟页面跳转 - SDK会自动监控路由变化
   */
  const navigateToDetail = () => {
    Taro.navigateTo({
      url: "/pages/index/index",
    });
    // SDK会自动监控这个页面跳转行为
  };

  /**
   * 模拟加载图片失败 - SDK会自动捕获资源加载错误
   */
  const loadBrokenImage = () => {
    // 这会触发图片加载失败，SDK可能会捕获
    console.log("🖼️ 尝试加载损坏的图片");
  };

  return (
    <View className="realworld-page">
      <Text className="page-title">🌍 真实应用监控测试</Text>
      <Text className="page-desc">
        以下操作会触发SDK的全局自动监控，无需手动调用任何SDK方法
      </Text>

      {/* 网络请求测试区域 */}
      <View className="test-section">
        <Text className="section-title">🌐 网络请求监控</Text>
        <Text className="section-desc">
          SDK会自动监控所有网络请求的性能和错误
        </Text>

        <Button className="test-btn success-btn" onClick={fetchUserProfile}>
          📊 正常API请求（会被监控）
        </Button>

        <Button
          className="test-btn error-btn"
          onClick={fetchInvalidData}
          loading={loading}
        >
          ❌ 失败API请求（会被捕获）
        </Button>
      </View>

      {/* 错误捕获测试区域 */}
      <View className="test-section">
        <Text className="section-title">🐛 错误自动捕获</Text>
        <Text className="section-desc">SDK会自动捕获各种JavaScript错误</Text>

        <Button className="test-btn error-btn" onClick={triggerJSError}>
          💥 触发JS运行时错误
        </Button>

        <Button className="test-btn error-btn" onClick={triggerPromiseError}>
          🔄 触发Promise异常
        </Button>
      </View>

      {/* 用户行为监控区域 */}
      <View className="test-section">
        <Text className="section-title">👆 用户行为监控</Text>
        <Text className="section-desc">SDK会自动监控用户交互和页面访问</Text>

        <View className="todo-container">
          <Input
            className="todo-input"
            placeholder="输入待办事项..."
            value={userInput}
            onInput={(e) => setUserInput(e.detail.value)}
          />
          <Button className="add-btn" onClick={addTodo} size="mini">
            ➕ 添加
          </Button>
        </View>

        <View className="todo-list">
          {todoList.map((todo, index) => (
            <View key={index} className="todo-item">
              <Text className="todo-text">{todo}</Text>
              <Button
                className="delete-btn"
                onClick={() => deleteTodo(index)}
                size="mini"
              >
                🗑️
              </Button>
            </View>
          ))}
        </View>

        <Button className="test-btn nav-btn" onClick={navigateToDetail}>
          🔗 页面跳转（会被监控）
        </Button>
      </View>

      {/* 资源加载测试区域 */}
      <View className="test-section">
        <Text className="section-title">🖼️ 资源加载监控</Text>
        <Text className="section-desc">SDK会监控资源加载状况</Text>

        <Button className="test-btn" onClick={loadBrokenImage}>
          🔗 测试图片加载
        </Button>

        {/* 故意加载一个不存在的图片 */}
        <Image
          className="test-image"
          src="https://nonexistent-domain-12345.com/broken-image.jpg"
          onError={() => {
            console.log("🖼️ 图片加载失败 - SDK可能会捕获此错误");
          }}
        />
      </View>

      {/* 监控说明 */}
      <View className="info-section">
        <Text className="info-title">📋 全局监控说明</Text>
        <Text className="info-text">
          ✅ 网络请求：自动监控所有Taro.request调用
        </Text>
        <Text className="info-text">✅ JavaScript错误：自动捕获运行时错误</Text>
        <Text className="info-text">
          ✅ Promise异常：自动捕获未处理的Promise拒绝
        </Text>
        <Text className="info-text">
          ✅ Console错误：自动捕获console.error输出
        </Text>
        <Text className="info-text">✅ 页面访问：自动监控页面加载和跳转</Text>
        <Text className="info-text">✅ 用户交互：自动监控点击和操作行为</Text>
        <Text className="info-text">⏰ 定时上报：每15秒自动上报收集的数据</Text>
      </View>
    </View>
  );
}

export default RealWorldTest;
