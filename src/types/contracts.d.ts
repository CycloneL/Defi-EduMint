import { Contract, BigNumberish, ContractTransaction } from 'ethers';

// EDUToken 合约接口
export interface EDUToken extends Contract {
  balanceOf(address: string): Promise<BigNumberish>;
  transfer(to: string, amount: BigNumberish): Promise<ContractTransaction>;
  approve(spender: string, amount: BigNumberish): Promise<ContractTransaction>;
  allowance(owner: string, spender: string): Promise<BigNumberish>;
  totalSupply(): Promise<BigNumberish>;
}

// CourseFactory 合约接口
export interface CourseFactory extends Contract {
  createCourse(
    title: string,
    description: string,
    price: BigNumberish,
    category: string,
    level: string,
    duration: number
  ): Promise<ContractTransaction>;
  getCourse(courseId: string): Promise<any>;
  getMyCourses(): Promise<string[]>;
  courseCount(): Promise<BigNumberish>;
}

// LearningManager 合约接口
export interface LearningManager extends Contract {
  enrollCourse(courseId: string, options?: { value: BigNumberish }): Promise<ContractTransaction>;
  completeLesson(courseId: string, lessonId: string): Promise<ContractTransaction>;
  getProgress(courseId: string): Promise<any>;
  withdrawFunds(courseId: string): Promise<ContractTransaction>;
  claimRewards(courseId: string): Promise<ContractTransaction>;
}

// 扩展Contract类型，使TypeScript能够识别合约方法
declare module 'ethers' {
  interface Contract {
    // 通用Contract属性
    runner: ContractRunner;
    
    // EDUToken 方法
    balanceOf?(address: string): Promise<BigNumberish>;
    transfer?(to: string, amount: BigNumberish): Promise<ContractTransaction>;
    approve?(spender: string, amount: BigNumberish): Promise<ContractTransaction>;
    
    // CourseFactory 方法
    createCourse?(
      title: string, 
      description: string,
      price: BigNumberish,
      category: string,
      level: string,
      duration: number
    ): Promise<ContractTransaction>;
    getCourse?(courseId: string): Promise<any>;
    
    // LearningManager 方法
    enrollCourse?(courseId: string, options?: { value: BigNumberish }): Promise<ContractTransaction>;
    completeLesson?(courseId: string, lessonId: string): Promise<ContractTransaction>;
  }
} 