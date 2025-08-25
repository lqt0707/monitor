// 这是一个复杂度较高的测试文件
function complexFunction() {
    let result = 0;
    
    // 多层嵌套循环
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            for (let k = 0; k < 10; k++) {
                result += i * j * k;
            }
        }
    }
    
    // 多个条件判断
    if (result > 1000) {
        console.log('结果大于1000');
    } else if (result > 500) {
        console.log('结果大于500');
    } else {
        console.log('结果较小');
    }
    
    // 嵌套函数
    function innerFunction(x) {
        return x * 2;
    }
    
    // 多个函数调用
    const doubled = innerFunction(result);
    const tripled = innerFunction(doubled);
    
    return tripled;
}

// 另一个复杂函数
function anotherComplexFunction() {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    return data
        .filter(x => x % 2 === 0)
        .map(x => x * 2)
        .reduce((acc, val) => acc + val, 0);
}

// 主函数
function main() {
    const result1 = complexFunction();
    const result2 = anotherComplexFunction();
    
    console.log('最终结果:', result1 + result2);
}

main();