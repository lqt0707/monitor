import React, { useState } from 'react'
import { useMonitor } from '../hooks/useMonitor.jsx'

function BehaviorTestPage() {
  const { trackBehavior, setUser, setTags } = useMonitor()
  const [userId, setUserId] = useState('react-user-' + Date.now())
  const [clickCount, setClickCount] = useState(0)

  const testButtonClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    trackBehavior('button-click', {
      buttonId: 'test-button',
      clickCount: newCount,
      timestamp: Date.now()
    })
  }

  const testFormSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    trackBehavior('form-submit', {
      formId: 'test-form',
      data: Object.fromEntries(formData),
      timestamp: Date.now()
    })
  }

  const updateUser = () => {
    setUser(userId, {
      name: '测试用户',
      role: 'tester',
      lastUpdate: new Date().toISOString()
    })
  }

  const updateTags = () => {
    setTags({
      testSession: 'react-behavior-test',
      timestamp: Date.now(),
      page: 'behavior-test'
    })
  }

  return (
    <div className="section">
      <h2>👤 用户行为测试</h2>
      
      <h3>点击行为测试</h3>
      <div>
        <button className="btn" onClick={testButtonClick}>
          🖱️ 点击测试 (已点击 {clickCount} 次)
        </button>
      </div>

      <h3>表单行为测试</h3>
      <form onSubmit={testFormSubmit}>
        <div className="form-group">
          <label>姓名:</label>
          <input name="name" type="text" placeholder="输入姓名" />
        </div>
        <div className="form-group">
          <label>邮箱:</label>
          <input name="email" type="email" placeholder="输入邮箱" />
        </div>
        <button type="submit" className="btn">📝 提交表单</button>
      </form>

      <h3>用户信息设置</h3>
      <div className="form-group">
        <label>用户ID:</label>
        <input 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div className="button-grid">
        <button className="btn success" onClick={updateUser}>
          👤 设置用户信息
        </button>
        <button className="btn" onClick={updateTags}>
          🏷️ 设置标签
        </button>
      </div>
    </div>
  )
}

export default BehaviorTestPage