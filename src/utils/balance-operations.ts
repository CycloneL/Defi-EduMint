import { toast } from 'react-hot-toast';
import { formatEther, parseEther } from 'ethers';

/**
 * 更新用户的EDU余额
 * @param amount 变更数量（可为正数或负数）
 * @param description 操作描述（将显示在提示中）
 * @returns 操作是否成功
 */
export const updateEduBalance = (amount: string, description: string = '交易'): boolean => {
  try {
    // 从本地存储读取当前余额
    let currentBalance = localStorage.getItem('eduBalance');
    let numBalance = currentBalance ? parseFloat(currentBalance) : 100; // 默认余额为100
    
    // 解析并计算新余额（确保是减法操作时余额不会为负）
    const amountNum = parseFloat(amount);
    const newBalance = numBalance + amountNum;
    
    // 如果是减法操作，确保余额不会为负
    if (amountNum < 0 && newBalance < 0) {
      toast.error(`EDU余额不足，无法${description}`);
      return false;
    }
    
    // 更新本地存储中的余额
    localStorage.setItem('eduBalance', newBalance.toString());
    
    // 更新全局状态中的余额（如果可能）
    if (typeof window !== 'undefined') {
      // 触发自定义事件以通知Navbar组件更新
      const balanceEvent = new CustomEvent('eduBalanceChanged', { 
        detail: { 
          balance: newBalance.toString(),
          change: amount,
          operation: amountNum >= 0 ? 'add' : 'subtract'
        } 
      });
      window.dispatchEvent(balanceEvent);
      
      // 如果金额为负，显示提示
      if (amountNum < 0) {
        toast.success(`已支出 ${Math.abs(amountNum)} EDU 用于${description}`);
      } else if (amountNum > 0) {
        toast.success(`已获得 ${amountNum} EDU`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('更新EDU余额失败:', error);
    toast.error('更新EDU余额失败');
    return false;
  }
}; 