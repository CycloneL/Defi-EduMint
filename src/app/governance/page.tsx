'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  LightBulbIcon,
  PlusCircleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

// 定义提案接口
interface Proposal {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  creator: string;
  createdAt: string;
  endTime: string;
  votesFor: number;
  votesAgainst: number;
  category: string;
  timeline: { time: string; event: string }[];
  threshold: number;
  hasVoted: boolean;
  voteChoice?: 'for' | 'against';
}

// 模拟提案数据
const mockProposals: Proposal[] = [
  {
    id: 1,
    title: '增加冷门课程流动性激励倍数',
    description: '将冷门课程的流动性提供激励从3倍增加到5倍，以吸引更多流动性并促进平台上冷门知识的传播',
    status: 'active',
    creator: '0x7a9d...3e4c',
    createdAt: '2023-05-15',
    endTime: '2023-05-22',
    votesFor: 2480000,
    votesAgainst: 1120000,
    category: '经济激励',
    timeline: [
      { time: '2023-05-15', event: '提案创建' },
      { time: '2023-05-17', event: '开始投票' },
      { time: '2023-05-22', event: '投票结束' }
    ],
    threshold: 3000000,
    hasVoted: false
  },
  {
    id: 2,
    title: '调整课程代币初始质押比例',
    description: '降低课程创建者需要提供的初始流动性池质押比例，从50%降低至30%，以降低创建者门槛',
    status: 'active',
    creator: '0x4b2a...9f7d',
    createdAt: '2023-05-12',
    endTime: '2023-05-19',
    votesFor: 1850000,
    votesAgainst: 1920000,
    category: '经济激励',
    timeline: [
      { time: '2023-05-12', event: '提案创建' },
      { time: '2023-05-14', event: '开始投票' },
      { time: '2023-05-19', event: '投票结束' }
    ],
    threshold: 3000000,
    hasVoted: false
  },
  {
    id: 3,
    title: '添加新的课程类别：元宇宙开发',
    description: '在课程分类中添加"元宇宙开发"类别，并为此类别的课程提供特殊展示位置和初始推广',
    status: 'passed',
    creator: '0x3c8b...2f6e',
    createdAt: '2023-05-01',
    endTime: '2023-05-08',
    votesFor: 3850000,
    votesAgainst: 950000,
    category: '平台功能',
    timeline: [
      { time: '2023-05-01', event: '提案创建' },
      { time: '2023-05-03', event: '开始投票' },
      { time: '2023-05-08', event: '投票结束' },
      { time: '2023-05-10', event: '提案通过' }
    ],
    threshold: 3000000,
    hasVoted: true,
    voteChoice: 'for'
  },
  {
    id: 4,
    title: '降低交易手续费率',
    description: '将课程代币交易的手续费从0.3%降低至0.25%，以促进更活跃的交易市场',
    status: 'rejected',
    creator: '0x9e4d...5a1c',
    createdAt: '2023-04-20',
    endTime: '2023-04-27',
    votesFor: 1250000,
    votesAgainst: 4350000,
    category: '经济激励',
    timeline: [
      { time: '2023-04-20', event: '提案创建' },
      { time: '2023-04-22', event: '开始投票' },
      { time: '2023-04-27', event: '投票结束' },
      { time: '2023-04-29', event: '提案拒绝' }
    ],
    threshold: 3000000,
    hasVoted: true,
    voteChoice: 'against'
  },
];

// 提案状态颜色映射
const statusColors: Record<string, string> = {
  active: 'text-yellow-400 bg-yellow-400/20',
  passed: 'text-green-400 bg-green-400/20',
  rejected: 'text-red-400 bg-red-400/20',
  pending: 'text-gray-400 bg-gray-400/20'
};

// 提案状态文字映射
const statusText: Record<string, string> = {
  active: '进行中',
  passed: '已通过',
  rejected: '已拒绝',
  pending: '待审核'
};

export default function GovernancePage() {
  const { connected, account, signer } = useWeb3();
  const [eduBalance, setEduBalance] = useState('1000'); // 模拟EDU余额
  const [votingPower, setVotingPower] = useState(1000); // 模拟投票权重
  const [proposals, setProposals] = useState<Proposal[]>(mockProposals);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votingSuccess, setVotingSuccess] = useState(false);
  
  // 表单状态
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: '',
    durationDays: '7'
  });
  
  // 提案创建加载状态
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [proposalCreated, setProposalCreated] = useState(false);
  
  // 过滤提案
  const filteredProposals = proposals.filter(
    proposal => activeTab === 'all' || proposal.status === activeTab
  );
  
  // 计算投票进度
  const calculateProgress = (votesFor: number, votesAgainst: number) => {
    const total = votesFor + votesAgainst;
    if (total === 0) return 0;
    return (votesFor / total) * 100;
  };
  
  // 计算剩余时间
  const calculateTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    
    const diff = end - now;
    if (diff <= 0) return '已结束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}天 ${hours}小时`;
  };
  
  // 投票
  const vote = async (proposalId: number, voteFor: boolean) => {
    if (!connected) {
      alert('请先连接钱包');
      return;
    }
    
    if (!account || !signer) {
      alert('钱包未正确连接');
      return;
    }
    
    setVotingLoading(true);
    
    try {
      // 检查是否有足够的EDU余额
      if (parseFloat(eduBalance) < 100) {
        throw new Error('您需要至少100 EDU代币才能投票');
      }
      
      console.log(`为提案 ${proposalId} 投票: ${voteFor ? '支持' : '反对'}`);
      
      // 触发钱包签名交易
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.utils.parseEther("0"), // 零值交易
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(
          `Vote ${voteFor ? 'FOR' : 'AGAINST'} on Proposal #${proposalId}`
        ))
      });
      
      console.log("投票交易已提交:", tx.hash);
      await tx.wait();
      
      // 更新提案的投票数
      const updatedProposals = proposals.map(proposal => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            votesFor: voteFor ? proposal.votesFor + votingPower : proposal.votesFor,
            votesAgainst: voteFor ? proposal.votesAgainst : proposal.votesAgainst + votingPower,
            hasVoted: true,
            voteChoice: voteFor ? 'for' : 'against' as 'for' | 'against'
          };
        }
        return proposal;
      });
      
      setProposals(updatedProposals);
      setVotingSuccess(true);
      
      setTimeout(() => {
        setVotingSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('投票失败:', error);
      alert(`投票失败: ${error.message || '未知错误'}`);
    } finally {
      setVotingLoading(false);
    }
  };
  
  // 创建提案
  const createProposal = async () => {
    if (!connected) {
      alert('请先连接钱包');
      return;
    }
    
    if (!account || !signer) {
      alert('钱包未正确连接');
      return;
    }
    
    if (!newProposal.title || !newProposal.description || !newProposal.category) {
      alert('请填写所有必填字段');
      return;
    }
    
    setCreatingProposal(true);
    
    try {
      // 检查是否有足够的EDU余额
      if (parseFloat(eduBalance) < 500) {
        throw new Error('您需要至少500 EDU代币才能创建提案');
      }
      
      // 触发钱包签名交易
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.utils.parseEther("0"), // 零值交易
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(
          `Create Proposal: ${newProposal.title}`
        ))
      });
      
      console.log("创建提案交易已提交:", tx.hash);
      await tx.wait();
      
      // 创建新提案
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + parseInt(newProposal.durationDays));
      
      const newProposalData: Proposal = {
        id: proposals.length + 1,
        title: newProposal.title,
        description: newProposal.description,
        status: 'pending',
        creator: account.substring(0, 6) + '...' + account.substring(account.length - 4),
        createdAt: now.toISOString(),
        endTime: endDate.toISOString(),
        votesFor: 0,
        votesAgainst: 0,
        category: newProposal.category,
        timeline: [
          { time: now.toLocaleDateString(), event: '提案创建' },
          { time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(), event: '开始投票' }
        ],
        threshold: 3000,
        hasVoted: false
      };
      
      setProposals([newProposalData, ...proposals]);
      setProposalCreated(true);
      
      // 重置表单
      setNewProposal({
        title: '',
        description: '',
        category: '',
        durationDays: '7'
      });
      
      setTimeout(() => {
        setProposalCreated(false);
        setShowCreateModal(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('创建提案失败:', error);
      alert(`创建提案失败: ${error.message || '未知错误'}`);
    } finally {
      setCreatingProposal(false);
    }
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">去中心化治理</h1>
          <p className="text-gray-400">参与提案投票，塑造教育DAO的未来</p>
        </div>
        
        {connected ? (
          <>
            {/* 用户信息卡片 */}
            <div className="glass rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">您的治理概况</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">EDU余额</span>
                      <span className="font-medium">{eduBalance} EDU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">投票权重</span>
                      <span className="font-medium">{votingPower} 票</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">已参与投票</span>
                      <span className="font-medium">{proposals.filter(p => p.hasVoted).length} 次</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">治理参与</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">作为EDU代币持有者，您可以对平台的重要决策进行投票，包括协议升级、资金分配和规则变更。</p>
                    <div className="text-xs text-gray-500">
                      每100 EDU = 100投票权重
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center items-center">
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 px-6 font-medium w-full md:w-auto"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <span className="flex items-center justify-center">
                      <PlusCircleIcon className="h-5 w-5 mr-2" />
                      创建提案
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    至少需要500 EDU才能创建提案
                  </p>
                </div>
              </div>
            </div>
            
            {/* 创建提案模态框 */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                <div className="glass rounded-xl p-6 w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">创建治理提案</h2>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowCreateModal(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">提案标题</label>
                      <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="输入提案标题"
                        value={newProposal.title}
                        onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">提案描述</label>
                      <textarea
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="详细描述您的提案内容和目的"
                        rows={5}
                        value={newProposal.description}
                        onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">提案分类</label>
                        <select
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newProposal.category}
                          onChange={(e) => setNewProposal({...newProposal, category: e.target.value})}
                        >
                          <option value="" className="bg-gray-800">选择分类</option>
                          <option value="平台治理" className="bg-gray-800">平台治理</option>
                          <option value="代币经济" className="bg-gray-800">代币经济</option>
                          <option value="财务" className="bg-gray-800">财务</option>
                          <option value="激励机制" className="bg-gray-800">激励机制</option>
                          <option value="技术升级" className="bg-gray-800">技术升级</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">投票持续时间</label>
                        <select
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newProposal.durationDays}
                          onChange={(e) => setNewProposal({...newProposal, durationDays: e.target.value})}
                        >
                          <option value="3" className="bg-gray-800">3天</option>
                          <option value="7" className="bg-gray-800">7天</option>
                          <option value="14" className="bg-gray-800">14天</option>
                          <option value="30" className="bg-gray-800">30天</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4 mb-6">
                    <h4 className="font-medium flex items-center mb-2">
                      <IdentificationIcon className="h-5 w-5 mr-2 text-indigo-400" />
                      提案要求
                    </h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>创建提案需要质押500 EDU代币</p>
                      <p>通过阈值：总投票的50%以上支持</p>
                      <p>执行时间：投票结束后24小时内</p>
                    </div>
                  </div>
                  
                  {proposalCreated && (
                    <div className="mb-4 bg-green-600/20 border border-green-500 text-green-400 rounded-lg p-3 text-center">
                      提案创建成功！它将在审核后显示在提案列表中。
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      className="px-4 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg text-gray-300"
                      onClick={() => setShowCreateModal(false)}
                    >
                      取消
                    </button>
                    
                    <button
                      className={`px-6 py-2 rounded-lg font-medium ${
                        creatingProposal || parseFloat(eduBalance) < 500
                          ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                      }`}
                      onClick={createProposal}
                      disabled={creatingProposal || parseFloat(eduBalance) < 500}
                    >
                      {creatingProposal ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          处理中...
                        </span>
                      ) : parseFloat(eduBalance) < 500 ? (
                        'EDU余额不足'
                      ) : (
                        '提交提案'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 提案过滤标签 */}
            <div className="flex border-b border-gray-700 mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('all')}
              >
                全部提案
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'active' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('active')}
              >
                进行中
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('pending')}
              >
                待投票
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'passed' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('passed')}
              >
                已通过
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'rejected' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('rejected')}
              >
                已拒绝
              </button>
            </div>
            
            {/* 提案列表 */}
            <div className="space-y-6">
              {filteredProposals.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-gray-400">暂无相关提案</p>
                </div>
              ) : (
                filteredProposals.map((proposal) => (
                  <div key={proposal.id} className="glass rounded-xl overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{proposal.title}</h3>
                          <div className="flex items-center text-sm space-x-4">
                            <span className="text-gray-400">提案 #{proposal.id}</span>
                            <span className="text-gray-400">由 {proposal.creator} 创建</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            proposal.status === 'active' ? 'bg-indigo-900/30 text-indigo-400' :
                            proposal.status === 'passed' ? 'bg-green-900/30 text-green-400' :
                            proposal.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                            'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            {proposal.status === 'active' ? '进行中' :
                             proposal.status === 'passed' ? '已通过' :
                             proposal.status === 'rejected' ? '已拒绝' : '待投票'}
                          </span>
                          <span className="bg-gray-800 px-3 py-1 text-sm rounded-full">
                            {proposal.category}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-6">{proposal.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400">投票进度</span>
                            <span>{proposal.votesFor} / {proposal.threshold}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (proposal.votesFor / proposal.threshold) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">目标</span>
                            <span>{proposal.threshold} 票</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400">当前投票</span>
                            <span>{proposal.votesFor + proposal.votesAgainst} 票已投</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full" 
                            >
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${calculateProgress(proposal.votesFor, proposal.votesAgainst)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-400">{proposal.votesFor} 票支持</span>
                            <span className="text-red-400">{proposal.votesAgainst} 票反对</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-gray-400">时间信息</span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>创建时间</span>
                              <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>结束时间</span>
                              <span>{new Date(proposal.endTime).toLocaleDateString()}</span>
                            </div>
                            {proposal.status === 'active' && (
                              <div className="flex justify-between font-medium">
                                <span>剩余时间</span>
                                <span>{calculateTimeRemaining(proposal.endTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 投票按钮 */}
                      {(proposal.status === 'active' || proposal.status === 'pending') && !proposal.hasVoted && (
                        <div className="mt-4">
                          {votingSuccess && (
                            <div className="mb-4 bg-green-600/20 border border-green-500 text-green-400 rounded-lg p-3 text-center">
                              投票成功提交！您的选择已记录。
                            </div>
                          )}
                          
                          <div className="flex space-x-4">
                            <button 
                              className={`flex-1 py-3 rounded-lg font-medium ${
                                votingLoading 
                                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                                  : 'bg-green-600/20 border border-green-500 text-green-400 hover:bg-green-600/30'
                              }`}
                              onClick={() => vote(proposal.id, true)}
                              disabled={votingLoading}
                            >
                              <span className="flex items-center justify-center">
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                支持
                              </span>
                            </button>
                            
                            <button 
                              className={`flex-1 py-3 rounded-lg font-medium ${
                                votingLoading 
                                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                                  : 'bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30'
                              }`}
                              onClick={() => vote(proposal.id, false)}
                              disabled={votingLoading}
                            >
                              <span className="flex items-center justify-center">
                                <XCircleIcon className="h-5 w-5 mr-2" />
                                反对
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* 已投票状态 */}
                      {proposal.hasVoted && (
                        <div className="mt-4 bg-indigo-900/20 border border-indigo-800 rounded-lg p-4 flex items-center justify-center">
                          <span className="flex items-center text-indigo-400">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            您已投票：{proposal.voteChoice === 'for' ? '支持' : '反对'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 提案时间线 */}
                    <div className="bg-gray-800/50 p-4">
                      <h4 className="font-medium mb-4">提案时间线</h4>
                      <div className="flex space-x-8">
                        {proposal.timeline.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                            <div>
                              <div className="text-sm">{item.event}</div>
                              <div className="text-xs text-gray-400">{item.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium mb-4">请先连接您的钱包</h3>
            <p className="text-gray-400 mb-6">连接钱包以参与DAO治理和提案投票</p>
          </div>
        )}
      </div>
    </div>
  );
} 